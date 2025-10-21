import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send('No token');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).send('Invalid token');
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user && req.user.role === role) next();
    else res.status(403).send('Permission denied');
  }
}
