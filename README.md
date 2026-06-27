# Hospital Queue Backend API

Express.js REST API for hospital queue management system.

## Setup

```bash
npm install
npm start
```

Runs on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/login` - User login

### Patients
- `GET /api/patients/:id/queue` - Get patient queue position
- `GET /api/patients/:id/medical-history` - Get patient history
- `GET /api/patients/:id/stats` - Get patient stats
- `POST /api/patients/:id/book-slot` - Book appointment
- `POST /api/patients/:id/fast-track` - Auto-allocate doctor
- `PATCH /api/patients/:id/queue` - Update queue status
- `PATCH /api/patients/:id/complete` - Mark appointment done
- `POST /api/patients/:id/prescription` - Add prescription

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id/queue` - Get doctor's active queue
- `PATCH /api/doctors/:id/status` - Update doctor status
- `PATCH /api/doctors/:id/availability` - Update availability

### General
- `GET /api/hospital` - Get all hospital data
- `GET /api/health` - Health check

## Testing

```bash
npm test
```

## Environment

- PORT: 3000 (default)
- Database: In-memory state (can be upgraded to SQL/NoSQL)

---

See parent README for full project structure.
