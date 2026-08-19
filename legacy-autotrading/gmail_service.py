import os
import base64
import json
from datetime import datetime, timedelta
from email import message_from_bytes
from email.utils import parsedate_to_datetime

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from models import db, OAuthToken

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']


def get_oauth_flow(redirect_uri):
    client_config = {
        "web": {
            "client_id": os.environ.get("GOOGLE_CLIENT_ID"),
            "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri],
        }
    }
    flow = Flow.from_client_config(client_config, scopes=SCOPES, redirect_uri=redirect_uri)
    return flow


def save_credentials(credentials, email):
    expiry = None
    if credentials.expiry:
        expiry = credentials.expiry

    token_record = OAuthToken.query.filter_by(email=email).first()
    if token_record:
        token_record.access_token = credentials.token
        token_record.refresh_token = credentials.refresh_token or token_record.refresh_token
        token_record.token_expiry = expiry
        token_record.updated_at = datetime.utcnow()
    else:
        token_record = OAuthToken(
            email=email,
            access_token=credentials.token,
            refresh_token=credentials.refresh_token,
            token_expiry=expiry,
        )
        db.session.add(token_record)
    db.session.commit()
    return token_record


def get_credentials():
    token_record = OAuthToken.query.first()
    if not token_record:
        return None

    creds = Credentials(
        token=token_record.access_token,
        refresh_token=token_record.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ.get("GOOGLE_CLIENT_ID"),
        client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
        scopes=SCOPES,
    )

    if token_record.is_expired() and creds.refresh_token:
        try:
            creds.refresh(Request())
            token_record.access_token = creds.token
            if creds.expiry:
                token_record.token_expiry = creds.expiry
            token_record.updated_at = datetime.utcnow()
            db.session.commit()
        except Exception as e:
            print(f"Failed to refresh token: {e}")
            return None

    return creds


def get_oauth_status():
    token_record = OAuthToken.query.first()
    if not token_record:
        return {"connected": False, "email": None}
    return {
        "connected": True,
        "email": token_record.email,
        "expired": token_record.is_expired(),
        "last_updated": token_record.updated_at.isoformat() if token_record.updated_at else None,
    }


def _decode_body(payload):
    """Recursively extract plain text and html from a Gmail message payload."""
    plain = ""
    html = ""
    mime_type = payload.get("mimeType", "")

    if mime_type == "text/plain":
        data = payload.get("body", {}).get("data", "")
        if data:
            plain = base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
    elif mime_type == "text/html":
        data = payload.get("body", {}).get("data", "")
        if data:
            html = base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
    elif "parts" in payload:
        for part in payload["parts"]:
            p, h = _decode_body(part)
            plain += p
            html += h

    return plain, html


def fetch_emails(max_results=50):
    creds = get_credentials()
    if not creds:
        return []

    try:
        service = build("gmail", "v1", credentials=creds)
        result = service.users().messages().list(
            userId="me",
            maxResults=max_results,
            q="is:unread"
        ).execute()

        messages = result.get("messages", [])
        emails = []

        for msg_ref in messages:
            try:
                msg = service.users().messages().get(
                    userId="me",
                    id=msg_ref["id"],
                    format="full"
                ).execute()

                headers = {h["name"].lower(): h["value"] for h in msg.get("payload", {}).get("headers", [])}
                plain, html = _decode_body(msg.get("payload", {}))

                date_str = headers.get("date", "")
                try:
                    received_at = parsedate_to_datetime(date_str)
                except Exception:
                    received_at = datetime.utcnow()

                emails.append({
                    "id": msg["id"],
                    "subject": headers.get("subject", "(Sans objet)"),
                    "from": headers.get("from", ""),
                    "date": received_at,
                    "body_plain": plain,
                    "body_html": html,
                })
            except Exception as e:
                print(f"Error fetching message {msg_ref['id']}: {e}")
                continue

        return emails
    except HttpError as e:
        print(f"Gmail API error: {e}")
        return []
    except Exception as e:
        print(f"Unexpected error fetching emails: {e}")
        return []


def mark_processed(email_id):
    """Track processed emails - stored implicitly via Vehicle.email_id."""
    pass


def disconnect():
    OAuthToken.query.delete()
    db.session.commit()
