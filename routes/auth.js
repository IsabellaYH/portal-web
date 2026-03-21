const crypto = require('crypto');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { getDb } = require('../db');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'public', 'uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('La imagen debe ser JPG, PNG o WEBP.');
      error.status = 400;
      return cb(error);
    }

    cb(null, true);
  },
});

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, 'portal-web-salt', 64, (error, derivedKey) => {
      if (error) {
        return reject(error);
      }
      resolve(derivedKey.toString('hex'));
    });
  });
}

function ensureAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

router.get('/', (req, res) => {
  res.render('register', {
    title: 'Registro',
    formData: {},
  });
});

router.post('/register', upload.single('avatar'), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const trimmedName = name?.trim();

    if (!trimmedName || !normalizedEmail || !password) {
      return res.status(400).render('register', {
        title: 'Registro',
        error: 'Nombre, email y contraseña son obligatorios.',
        formData: { name: trimmedName, email: normalizedEmail },
      });
    }

    const db = await getDb();
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', normalizedEmail);

    if (existingUser) {
      return res.status(409).render('register', {
        title: 'Registro',
        error: 'Ya existe un usuario registrado con ese email.',
        formData: { name: trimmedName, email: normalizedEmail },
      });
    }

    const passwordHash = await hashPassword(password);
    const avatarPath = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await db.run(
      'INSERT INTO users (name, email, password_hash, avatar_path) VALUES (?, ?, ?, ?)',
      trimmedName,
      normalizedEmail,
      passwordHash,
      avatarPath
    );

    req.session.user = {
      id: result.lastID,
      name: trimmedName,
      email: normalizedEmail,
      avatarPath,
    };

    res.redirect('/welcome');
  } catch (error) {
    next(error);
  }
});

router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login',
    formData: {},
  });
});

router.post('/login', async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).render('login', {
        title: 'Login',
        error: 'Debes completar email y contraseña.',
        formData: { email },
      });
    }

    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', email);

    if (!user) {
      return res.status(401).render('login', {
        title: 'Login',
        error: 'Usuario no encontrado. Regístrese primero.',
        formData: { email },
      });
    }

    const passwordHash = await hashPassword(password);

    if (passwordHash !== user.password_hash) {
      return res.status(401).render('login', {
        title: 'Login',
        error: 'Credenciales inválidas.',
        formData: { email },
      });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarPath: user.avatar_path,
    };

    res.redirect('/welcome');
  } catch (error) {
    next(error);
  }
});

router.get('/welcome', ensureAuthenticated, (req, res) => {
  res.render('welcome', {
    title: 'Bienvenida',
    user: req.session.user,
  });
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }
    res.redirect('/login');
  });
});

module.exports = router;
