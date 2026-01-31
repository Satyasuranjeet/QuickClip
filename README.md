# QuickClip - Secure Clipboard Sharing

A secure, time-limited clipboard sharing service. Share text instantly with a code that expires automatically.

![QuickClip](./client/public/clipboard.svg)

## Features

- 📤 **Share Text** - Generate a unique 6-character code to share your text
- 📥 **Receive Text** - Enter the code to retrieve shared text
- ⏱️ **Time-Limited** - Set expiration from 30 seconds to 10 minutes
- 🔒 **Secure** - Data auto-deletes when timer expires
- 🚀 **Fast** - Built with React + FastAPI
- 📱 **Responsive** - Works on all devices

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast builds
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls

### Backend
- FastAPI (Python)
- MongoDB with Motor (async driver)
- Rate limiting with SlowAPI
- Pydantic for validation

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.10+
- MongoDB (local or Atlas)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Satyasuranjeet/quickclip.git
   cd quickclip
   ```

2. **Start MongoDB** (using Docker)
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Setup Backend**
   ```bash
   cd server
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your settings
   python app.py
   ```

4. **Setup Frontend**
   ```bash
   cd client
   npm install
   cp .env.example .env
   npm run dev
   ```

5. Open http://localhost:5173

## Production Deployment

### Using Docker Compose

1. **Configure environment**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with production settings
   ```

2. **Build and run**
   ```bash
   docker-compose up -d --build
   ```

3. Access at http://localhost

### Manual Deployment

#### Backend
```bash
cd server
pip install -r requirements.txt
export ENVIRONMENT=production
export MONGODB_URL=your-mongodb-url
export ALLOWED_ORIGINS=https://yourdomain.com
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Frontend
```bash
cd client
npm ci
VITE_API_URL=https://api.yourdomain.com npm run build
# Serve dist/ with nginx or any static file server
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/clips/` | Create a new clip |
| GET | `/api/clips/{code}` | Get clip by code |
| DELETE | `/api/clips/{code}` | Delete a clip |
| GET | `/health` | Health check |

## Environment Variables

### Backend (.env)
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=quickclip
ENVIRONMENT=production
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=https://yourdomain.com
RATE_LIMIT_PER_MINUTE=30
HOST=0.0.0.0
PORT=8000
WORKERS=4
```

### Frontend (.env)
```env
VITE_API_URL=https://api.yourdomain.com
```

## Security Features

- ✅ Rate limiting (30 requests/minute per IP)
- ✅ CORS protection
- ✅ Security headers (X-Frame-Options, XSS Protection, etc.)
- ✅ Input validation
- ✅ Auto-expiring data (MongoDB TTL index)
- ✅ No sensitive data logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

Created by [Satya](https://github.com/Satyasuranjeet)
