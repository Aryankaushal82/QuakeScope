# QuakeScope

Real-time earthquake visualization and alert subscriptions.

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Firebase (Firestore, Functions)

## Getting Started

Prerequisites: Node.js 18+, npm

1. Install dependencies
```sh
npm i
```

2. Configure environment variables in `.env`
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
# Optional: enable callable alerts
VITE_ENABLE_ALERTS_CALLABLE=false
```

3. Run the dev server
```sh
npm run dev
```

## Features

- Explore recent seismic events on an interactive map
- Filters, insights, and timeline playback
- Subscribe with your email to receive alerts (Firestore save; Functions optional)

## Deployment

Build the app:
```sh
npm run build
```
Preview locally:
```sh
npm run preview
```

Deploy to any static host (Netlify, Vercel, Firebase Hosting, etc.)

## License

MIT
