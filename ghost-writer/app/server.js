require('dotenv').config();
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const cookieParser = require('cookie-parser');
const path = require('path');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 2369;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  store: new FileStore({ path: '/tmp/sessions', retries: 1 }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    domain: process.env.GHOST_COOKIE_DOMAIN,
    sameSite: 'lax'
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

async function verifyGhostMember(req) {
  try {
    const GHOST = process.env.GHOST_URL;
    const memberCookie = req.headers.cookie || '';
    const memberRes = await fetch(`${GHOST}/members/api/member/`, {
      headers: { 'Cookie': memberCookie, 'Accept': 'application/json' }
    });
    if (memberRes.ok) return await memberRes.json();
    return null;
  } catch (err) {
    return null;
  }
}

async function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  const member = await verifyGhostMember(req);
  if (member) {
    req.session.authenticated = true;
    req.session.member = {
      name: member.name || member.email.split('@')[0],
      email: member.email,
      avatar: member.avatar_image
    };
    req.session.save(() => next());
    return;
  }
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Not authenticated' });
  res.redirect(`${process.env.GHOST_URL}/#/portal/signin`);
}

app.get('/write', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

app.get('/write/edit/:id', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

app.post('/write/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.use('/write/api', requireAuth, apiRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ghost Writer running on port ${PORT}`);
});
