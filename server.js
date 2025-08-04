// DisplayBox server: hosts splash page and site viewer
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000; // Port for DisplayBox itself
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me'; // Simple admin password

// Paths to data files that persist site list and theme
const sitesPath = path.join(__dirname, 'data', 'sites.json');
const configPath = path.join(__dirname, 'data', 'config.json');

// Helper function to read JSON from disk safely
function readJSON(filePath, defaultValue) {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (err) {
    // Log any failure and fall back to the provided default
    console.error(`Failed to read or parse ${filePath}:`, err.message);
    return defaultValue;
  }
}

// Helper function to write JSON to disk
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    // Report issues writing the file but allow execution to continue
    console.error(`Failed to write ${filePath}:`, err.message);
  }
}

// Load sites and theme configuration
function loadSites() {
  return readJSON(sitesPath, []);
}

function saveSites(sites) {
  writeJSON(sitesPath, sites);
}

function loadConfig() {
  return readJSON(configPath, { themeColor: '#333' });
}

function saveConfig(config) {
  writeJSON(configPath, config);
}

// Configure express to use EJS templates and serve static files
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Basic session middleware for login management
app.use(session({
  secret: 'displaybox-secret', // Secret used to sign session ID cookie
  resave: false,
  saveUninitialized: false
}));

// Middleware to protect admin routes
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.redirect('/login');
}

// Splash page listing all sites
app.get('/', (req, res) => {
  const sites = loadSites();
  const config = loadConfig();
  res.render('index', {
    sites,
    theme: config,
    auth: req.session.authenticated
  });
});

// Page that embeds a selected site using an iframe
app.get('/site/:id', (req, res) => {
  const sites = loadSites();
  const site = sites.find(s => s.id === req.params.id);
  const config = loadConfig();
  if (!site) {
    // If site not found, redirect to splash page
    return res.redirect('/');
  }
  res.render('site', {
    sites,
    site,
    host: req.hostname,
    theme: config,
    auth: req.session.authenticated
  });
});

// Render login page
app.get('/login', (req, res) => {
  const sites = loadSites();
  const config = loadConfig();
  res.render('login', {
    sites,
    theme: config,
    error: null,
    auth: req.session.authenticated
  });
});

// Handle login submission
app.post('/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    // Mark session as authenticated if password matches
    req.session.authenticated = true;
    return res.redirect('/admin');
  }
  // Otherwise reload login page with error
  const sites = loadSites();
  const config = loadConfig();
  res.render('login', {
    sites,
    theme: config,
    error: 'Invalid password',
    auth: false
  });
});

// Logout clears the session
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Admin dashboard for CRUD operations
app.get('/admin', requireAuth, (req, res) => {
  const sites = loadSites();
  const config = loadConfig();
  res.render('admin', {
    sites,
    theme: config,
    auth: true
  });
});

// Add a new site entry
app.post('/admin/site', requireAuth, (req, res) => {
  const sites = loadSites();
  // Simple unique ID using timestamp
  const newSite = {
    id: Date.now().toString(),
    name: req.body.name,
    description: req.body.description,
    port: req.body.port
  };
  sites.push(newSite);
  saveSites(sites);
  res.redirect('/admin');
});

// Delete an existing site
app.post('/admin/site/:id/delete', requireAuth, (req, res) => {
  let sites = loadSites();
  sites = sites.filter(s => s.id !== req.params.id);
  saveSites(sites);
  res.redirect('/admin');
});

// Update theme color
app.post('/admin/theme', requireAuth, (req, res) => {
  const config = loadConfig();
  config.themeColor = req.body.themeColor;
  saveConfig(config);
  res.redirect('/admin');
});

// Start the server
app.listen(PORT, () => {
  console.log(`DisplayBox running on port ${PORT}`);
});

