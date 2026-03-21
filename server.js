const path = require('path');
const express = require('express');
const session = require('express-session');
const hbs = require('hbs');
const { getDb } = require('./db');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

hbs.registerPartials(path.join(__dirname, 'views', 'partials'));
hbs.registerHelper('hasAvatar', (avatarPath) => Boolean(avatarPath));
hbs.registerHelper('year', () => new Date().getFullYear());

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));


app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'portal-web-secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

app.use('/', authRouter);

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Página no encontrada',
    message: 'La ruta solicitada no existe.',
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  const status = error.status || 500;
  res.status(status).render('error', {
    title: 'Ocurrió un error',
    message: error.message || 'Intenta nuevamente en unos minutos.',
  });
});

getDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor disponible en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo iniciar la base de datos:', error);
    process.exit(1);
  });
