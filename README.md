# DisplayBox

DisplayBox is a small Node.js application that showcases multiple web apps hosted on different ports of the same server. It provides:

- A thin navigation bar with tabs for each site.
- A splash page listing all configured sites.
- An admin interface to add or remove sites and change the theme color.

## Setup

1. Install dependencies:

```bash
npm install
```

2. (Optional) Set an admin password before starting:

```bash
export ADMIN_PASSWORD=mysecret
```

3. Start the server:

```bash
npm start
```

The app listens on port 3000 by default. Visit `http://yourhost:3000` to view the splash page.

## Testing

No automated tests are provided yet. A placeholder script runs when invoking:

```bash
npm test
```

