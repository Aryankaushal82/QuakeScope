

# QuakeScope

QuakeScope is a web application for exploring recent earthquake activity with a focus on clarity, interactivity, and user control. The app features a dark, modern UI and is designed for users who want to:

- View recent earthquakes on a world map with color-coded markers by magnitude
- Use filters to select time range, magnitude, and depth
- Switch between cluster and heatmap visualizations
- See detailed event info, including location, time, depth, and a quick AI-generated summary
- Explore insights panels with statistics and charts (magnitude, depth, largest, most recent, etc.)

## Features

- **Interactive Map**: Pan, zoom, and click on earthquakes for details. Markers are colored and sized by magnitude. Cluster and heatmap modes are available.
- **Filters**: Quickly filter events by time (1 day, 7 days, 30 days), magnitude, and depth. Toggle heatmap and cluster overlays.
- **Insights Panel**: See stats like total events, largest magnitude, average, deepest, most recent, and distribution charts.
- **AI Event Summary**: For each event, generate a short, plain-language summary using AI (if API key is set).
- **Mobile Friendly**: Responsive layout and touch support.

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui (Radix UI)
- Leaflet (map), Framer Motion (animations)

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation
1. Clone the repository:
	```sh
	git clone https://github.com/Aryankaushal82/QuakeScope.git
	cd QuakeScope
	```
2. Install dependencies:
	```sh
	npm install
	```
3. Configure environment variables:
	Create a `.env` file in the root directory and add:
	```env
	VITE_OPENROUTER_API_KEY=
	```

### Running Locally
Start the development server:
```sh
npm run dev
```
Visit the local URL shown in your terminal.

## Deployment

Build the app for production:
```sh
npm run build
```
Preview the production build locally:
```sh
npm run preview
```
Deploy the contents of the `dist` folder to any static host (Netlify, Vercel, Firebase Hosting, etc.).

## Contributing

Pull requests and issues are welcome. Please describe your changes clearly.

## License

MIT

## Tech Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- [Leaflet](https://leafletjs.com/) (map), [Framer Motion](https://www.framer.com/motion/) (animations)

### Prerequisites
- Node.js 18+
- npm


## Contributing

Contributions are welcome! Please open issues or pull requests for bug fixes, features, or improvements.

## License

This project is licensed under the MIT License.
