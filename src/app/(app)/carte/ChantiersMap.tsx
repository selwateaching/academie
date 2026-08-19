'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { CHANTIER_STATUSES } from '@/lib/enums';

type ChantierPoint = {
  id: string; name: string; address: string | null; lat: number; lng: number;
  status: string; clientName: string; managerName?: string | null; startDate: string | null;
};

export function ChantiersMap({ chantiers }: { chantiers: ChantierPoint[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapRef.current || mapInstance.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const points = chantiers.filter((c) => c.lat && c.lng);
      const center: [number, number] = points.length > 0 ? [points[0].lat, points[0].lng] : [46.6, 2.5];
      const map = L.map(mapRef.current).setView(center, points.length > 0 ? 12 : 5);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      for (const c of points) {
        const statusLabel = (CHANTIER_STATUSES as any)[c.status]?.label ?? c.status;
        const marker = L.marker([c.lat, c.lng]).addTo(map);
        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 180px;">
            <p style="font-weight:700;margin:0 0 4px;">${c.name}</p>
            <p style="margin:0;color:#64748b;font-size:12px;">${c.address ?? ''}</p>
            <p style="margin:4px 0 0;font-size:12px;"><b>Client :</b> ${c.clientName}</p>
            <p style="margin:2px 0 0;font-size:12px;"><b>Statut :</b> ${statusLabel}</p>
            ${c.managerName ? `<p style="margin:2px 0 0;font-size:12px;"><b>Responsable :</b> ${c.managerName}</p>` : ''}
            <a href="https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}" target="_blank" style="display:inline-block;margin-top:6px;color:#1d4ed8;font-size:12px;">Itinéraire →</a>
          </div>
        `);
      }

      if (points.length > 1) {
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    })();

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [chantiers]);

  return <div ref={mapRef} className="w-full h-[calc(100vh-220px)] rounded-2xl border border-ink-200 z-0" />;
}
