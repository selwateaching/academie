const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function signProfessorToken(professor) {
  return jwt.sign({ sub: professor.id, role: 'professor' }, JWT_SECRET, { expiresIn: '30d' });
}

function signAdminToken() {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
}

function requireProfessor(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'professor') return res.status(403).json({ error: 'Accès refusé' });
    req.professorId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Session invalide ou expirée' });
  }
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    next();
  } catch {
    return res.status(401).json({ error: 'Session invalide ou expirée' });
  }
}

module.exports = { signProfessorToken, signAdminToken, requireProfessor, requireAdmin };
