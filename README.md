# MediaShare — Cloud-Native AI-Powered Media Sharing Platform

A production-ready, Instagram-like media sharing application built with **Next.js** and **Microsoft Azure** services. Features AI-powered image analysis, automated content moderation, and intelligent search.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App                          │
│  ┌──────────────┐  ┌───────────────────────────────┐    │
│  │   React UI   │  │      API Routes (/api/*)      │    │
│  │  (Frontend)  │  │         (Backend)              │    │
│  └──────────────┘  └───────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
    ┌────────────────┼────────────────────┐
    │                │                    │
    ▼                ▼                    ▼
┌────────┐    ┌──────────┐    ┌──────────────────┐
│ Cosmos │    │   Blob   │    │   Azure AI       │
│   DB   │    │ Storage  │    │ Vision + Safety  │
└────────┘    └──────────┘    └──────────────────┘
```

## ✨ Features

- **Two User Roles**: Creator (upload images) & Consumer (browse, search, comment, rate)
- **AI Image Analysis**: Automatic tagging and captioning via Azure AI Vision 4.0
- **Content Moderation**: Automated detection of unsafe content via Azure AI Content Safety
- **AI-Powered Search**: Find images by AI-detected tags, captions, and location
- **JWT Authentication**: Secure login with role-based access control
- **Comments & Ratings**: Consumers can engage with content (1-5 star ratings)
- **Paginated Feed**: Efficient browsing with pagination
- **Premium Dark UI**: Glassmorphism, gradients, and micro-animations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Azure account (optional — app runs in mock mode without Azure credentials)

### Installation

```bash
# Clone and install
cd MediaShare
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Azure Configuration

To connect Azure services, update `.env.local` with your credentials:

```env
# Azure Cosmos DB
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_KEY=your-primary-key
COSMOS_DATABASE=mediashare

# Azure Blob Storage
STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
STORAGE_CONTAINER_NAME=media

# Azure AI Vision
VISION_ENDPOINT=https://your-region.api.cognitive.microsoft.com/
VISION_KEY=your-key

# Azure AI Content Safety
CONTENT_SAFETY_ENDPOINT=https://your-region.cognitiveservices.azure.com/
CONTENT_SAFETY_KEY=your-key
```

## 📡 API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/signup` | ❌ | — | Register new user |
| POST | `/api/auth/login` | ❌ | — | Authenticate user |
| POST | `/api/posts` | ✅ | Creator | Upload image (FormData) |
| GET | `/api/posts` | ✅ | Any | Paginated feed |
| GET | `/api/posts/search?q=` | ✅ | Consumer | AI-powered search |
| GET | `/api/posts/[id]` | ✅ | Any | Single post detail |
| GET | `/api/posts/user/me` | ✅ | Creator | My uploads |
| POST | `/api/comments` | ✅ | Consumer | Add comment |
| GET | `/api/comments/[postId]` | ✅ | Any | Get comments |
| POST | `/api/ratings` | ✅ | Consumer | Rate image (1-5) |
| GET | `/api/ratings/[postId]` | ✅ | Any | Get ratings |
| GET | `/api/health` | ❌ | — | Health check |

## 📂 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API Route Handlers
│   │   ├── auth/           # signup, login
│   │   ├── posts/          # CRUD, search, user/me
│   │   ├── comments/       # add, list by post
│   │   ├── ratings/        # add, list by post
│   │   └── health/         # health check
│   ├── feed/               # Consumer feed page
│   ├── upload/             # Creator upload page
│   ├── post/[id]/          # Post detail page
│   ├── my-posts/           # Creator's posts
│   ├── login/              # Auth page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Design system
├── components/             # React components
│   ├── Navbar.tsx
│   ├── PostCard.tsx
│   ├── StarRating.tsx
│   └── Toast.tsx
├── context/
│   └── AuthContext.tsx      # Auth state management
├── hooks/
│   └── useApi.ts           # API client hook
└── lib/
    ├── config/             # Azure service clients
    ├── services/           # Business logic
    ├── middleware/          # JWT auth
    ├── types.ts            # TypeScript types
    ├── helpers.ts          # Utilities
    ├── validators.ts       # Input validation
    └── init.ts             # Service bootstrapper
```

## 🧠 Data Model (Cosmos DB)

| Container | Partition Key | Purpose |
|-----------|--------------|---------|
| `users` | `/id` | User accounts |
| `posts` | `/userId` | Images + metadata |
| `comments` | `/postId` | Post comments |
| `ratings` | `/postId` | Post ratings |

## 📊 Example API Requests

### Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"creator@test.com","password":"test123","displayName":"TestCreator","role":"creator"}'
```

### Upload Image
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@photo.jpg" \
  -F "caption=Beautiful sunset" \
  -F "location=London, UK"
```

### Search Posts
```bash
curl "http://localhost:3000/api/posts/search?q=sunset" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚀 Deployment to Azure

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step Azure deployment instructions.

## 📄 License

MIT
