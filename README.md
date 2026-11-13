# QueueFlow

A lightweight queue management app for service teams. Managers can create queues, add customers, reorder or cancel waiting tokens, call the next person for service, and view live operational analytics.

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

### Demo manager

- Email: `manager@queueflow.app`
- Password: `queue123`

Data is stored in `data/store.json` and created automatically on first run. To reset the demo, stop the server and remove that file.

## Features

- Manager login with signed, HTTP-only session cookie
- Multiple named queues and queue switching
- Customer names and automatically generated tokens
- Move waiting tokens up/down in line
- Call the next person and finish service
- Cancel tokens with a reason/status recorded
- Dashboard metrics and a 7-day arrivals trend
- Responsive layout for desktop and mobile

## Technical overview

- Node.js + Express REST API
- Plain HTML, CSS, and browser JavaScript frontend (no build step)
- JSON-file persistence to keep local setup simple
- API endpoints are under `/api`; frontend assets are served from `public/`

This demo is intended for local evaluation. Change the demo credentials and use a database plus production-grade session storage before deploying for real customer data.
