import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'Kein Token, Autorisierung verweigert.' });
  }

  const parts = authHeader.trim().split(/\s+/);
  const scheme = parts[0];
  const token = parts.slice(1).join('');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token-Format ist ungültig. Erwartet: Bearer <token>.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dein_super_geheimnis_hier';
    const decoded = jwt.verify(token, secret);

    req.user = {
      id: decoded.userId || decoded.id,
      ...decoded
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token ist nicht gültig oder abgelaufen.' });
  }
};

export default auth;