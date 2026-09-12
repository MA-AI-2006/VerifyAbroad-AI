# FastAPI Backend Integration Setup

Your VerifyAbroad-AI frontend is now ready to connect to the FastAPI backend. Here's what you need to do:

## 🚀 Quick Start

### 1. Set the Backend URL

In your deployment or `.env.local`:

```bash
BACKEND_URL=http://localhost:8000
# OR for production
BACKEND_URL=https://your-backend-domain.com
```

### 2. How It Works

- **`src/server/backend-client.ts`**: Core client library for FastAPI communication
- **`src/services/api-backend.ts`**: Integration bridge (drop-in replacement for `api.ts`)
- **Detection**: Automatically switches to backend mode when `BACKEND_URL` is set

### 3. Backend Endpoints Required

The FastAPI backend must implement these endpoints:

#### Investigations
- `POST /investigations` - Start new investigation
- `GET /investigations` - List investigations
- `GET /investigations/{id}` - Get investigation details
- `POST /investigations/{id}/messages` - Send message
- `DELETE /investigations/{id}` - Delete investigation

#### Evidence
- `POST /investigations/{id}/evidence` - Upload evidence (file or text)

#### Verification
- `POST /investigations/{id}/verify` - Run verification pipeline
- `GET /investigations/{id}/results` - Get verification results

#### Search & Lookup
- `GET /universities/{name}` - Look up university
- `GET /scholarships/{name}` - Look up scholarship
- `GET /agents/{name}` - Look up consultant
- `POST /search` - Live intelligence search
- `POST /sanctions` - Sanctions/entity screening
- `GET /knowledge` - Query fraud pattern knowledge base

#### Health
- `GET /health` - Backend health check

## 🔧 Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `BACKEND_URL` | FastAPI backend URL | `http://localhost:8000` |
| `NEXT_PUBLIC_BACKEND_URL` | Frontend-accessible URL | (same as BACKEND_URL) |

## 📋 Response Format

The backend should return responses in this format:

```json
{
  "investigation_id": "123",
  "assistant_message": "...",
  "structured_case": {...},
  "ready_for_verification": true
}
```

## ⚠️ Error Handling

Errors from the backend should use this format:

```json
{
  "detail": "Error message here"
}
```

## 🧪 Testing

To test the integration:

```bash
# 1. Start FastAPI backend
cd ../your-backend-repo
python -m uvicorn main:app --reload

# 2. In a new terminal, start Next.js with backend URL
BACKEND_URL=http://localhost:8000 npm run dev

# 3. Try the investigation chat
# The frontend will automatically use the backend endpoints
```

## 🔐 Security Notes

**CRITICAL**: Never commit `.env` files with real API keys!

The included files need:
- `GEMINI_API_KEY` (server-side only)
- `GROQ_API_KEY` (server-side only)
- `TAVILY_API_KEY` (server-side only)
- `OPENSANCTIONS_API_KEY` (server-side only)

Store these in:
- Development: `.env.local` (git-ignored)
- Production: Environment variables in your deployment platform

## 📝 Notes

- The frontend automatically falls back to internal engine if backend URL is not configured
- All backend responses are validated and typed
- Network errors are caught and reported clearly
- The investigation chat works identically whether using backend or internal engine

## 🔗 Frontend Integration Path

```
User Message
    ↓
Chat Component → api.investigation.sendMessage()
    ↓
backend-client.ts (if BACKEND_URL set)
    ↓
FastAPI Backend → Investigation Engine
    ↓
Response ← Chat Display
```
