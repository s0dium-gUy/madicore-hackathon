# Hospital Dashboard Frontend

React + Tailwind CSS responsive dashboard for hospital queue management.

## Setup

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`

## Features

- **Authentication**: Login page redirect
- **Dashboard**: 3-column responsive layout
- **Header**: User profile, navigation tabs
- **Patient Info**: Contact form for patient details
- **Consultation**: Doctor selection & appointment booking
- **Queue Status**: Real-time token number & wait time
- **DNA Background**: Animated SVG helix background

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Architecture

- **React 18** - UI framework
- **Tailwind CSS** - Styling & responsiveness
- **Vite** - Build tool & dev server
- **Lucide React** - Icon library

## File Structure

```
src/
├── App.jsx              # Main app with login check
├── index.css            # Tailwind imports & animations
├── main.jsx             # React entry point
└── components/
    ├── Dashboard.jsx    # Main layout
    ├── Header.jsx       # Top navigation
    ├── DNAHelix.jsx     # Background SVG
    └── *Card.jsx        # Content cards
```

## API Integration

Connects to backend at `http://localhost:3000/api`

- Fetches doctors list
- Displays patient queue position
- Submits appointment bookings

---

See parent README for full project structure.
