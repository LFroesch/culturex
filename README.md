# Cultural Exchange Platform

A comprehensive location-based web application for cultural exploration, knowledge preservation, and global community connection. Users explore cities on an interactive map, discover curated content (news, history, videos), contribute their own knowledge, and connect with people worldwide.

## Features

### Core Features
- **Interactive Map**: Full-screen Leaflet/OpenStreetMap interface with city markers
- **City Exploration**: Click cities to view news, history (Wikipedia), videos (YouTube), and user-generated content
- **Random Discovery**: "Surprise Me" button for spontaneous exploration
- **Multi-type Posts**: 8 specialized content types (insights, photos, food, recipes, stories, music, work exchange, forum)
- **Dynamic Post Creation**: Form adapts based on content type with type-specific fields
- **User Authentication**: Secure JWT-based auth with role-based access (user/moderator/admin)
- **Content Moderation System**:
  - Automatic content flagging (spam, profanity, duplicate detection)
  - Moderator dashboard for reviewing pending/flagged posts
  - Approve/reject workflow with reasons
- **Admin Dashboard**:
  - System statistics
  - User management (role changes, deletion)
  - Moderator assignment to cities
  - Complete oversight of all content
- **Image Upload**: Cloudinary integration with automatic moderation
- **Rate Limiting**: Environment-aware (disabled in dev, active in production)
- **Notifications**: Real-time system for friend requests, messages, post status
- **User Profiles**: Detailed profiles with city location, interests, languages, photos
- **Real-time Chat**: Private messaging with Socket.io and typing indicators
- **Connections**: Friend request system with privacy settings
- **External APIs**: Wikipedia, YouTube, News API integration
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- MongoDB + Mongoose (with geospatial indexes)
- Socket.io (real-time messaging)
- JWT authentication + bcryptjs
- External APIs: Wikipedia, YouTube, News API
- Cloudinary (image uploads with moderation)
- Multer (multipart file handling)
- Content moderation system (auto-flagging)
- Rate limiting (memory-based, Redis-ready)
- Axios (external API calls)

### Frontend
- React 18 + TypeScript
- React Router
- Leaflet + React-Leaflet (interactive maps)
- Zustand (state management)
- Axios + Socket.io Client
- Tailwind CSS
- Vite

## Project Structure

```
culturalexchangeapp/
├── server/                 # Backend API
│   ├── src/
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth middleware
│   │   ├── socket/        # Socket.io handlers
│   │   ├── config/        # Database config
│   │   ├── utils/         # Validation utilities
│   │   └── index.ts       # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand store
│   │   ├── lib/           # API & Socket clients
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main app component
│   ├── package.json
│   └── vite.config.ts
└── package.json           # Root package.json
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

## Installation

### 1. Clone the repository (or navigate to project directory)

```bash
cd culturalexchangeapp
```

### 2. Install root dependencies

```bash
npm install
```

### 3. Install server dependencies

```bash
cd server
npm install
cd ..
```

### 4. Install client dependencies

```bash
cd client
npm install
cd ..
```

### 5. Set up environment variables

#### Server (.env)

Create `server/.env` file:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cultural-exchange
JWT_SECRET=your_secure_jwt_secret_key_change_this
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# External APIs (Optional - get free keys from their websites)
YOUTUBE_API_KEY=your_youtube_api_key_here
NEWS_API_KEY=your_news_api_key_here

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Notes on API Keys:**
- **YouTube API**: Get free key at https://console.cloud.google.com/ (10,000 units/day)
- **News API**: Get free key at https://newsapi.org/ (100 requests/day in dev mode)
- Both are optional - the app works without them, but city panels will show "not available" for those sections

#### Client (.env)

Create `client/.env` file:

```bash
cp client/.env.example client/.env
```

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 6. Start MongoDB

**Option A: Local MongoDB**
```bash
# On Linux/Mac
sudo systemctl start mongod

# Or using MongoDB service
mongod
```

**Option B: MongoDB Atlas (Online)**
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create M0 cluster (free tier)
3. Create database user with password
4. Whitelist IP (or allow all for dev)
5. Get connection string and update `server/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cultural-exchange?retryWrites=true&w=majority
   ```

### 7. Seed the database with cities

```bash
cd server
npm run seed
cd ..
```

This will populate the database with 20 major cities around the world.

## Running the Application

### Development Mode (Both servers)

From the root directory:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend dev server on `http://localhost:5173`

### First Time Setup:
1. Visit `http://localhost:5173`
2. Register a new account
3. Explore the interactive map
4. Click on cities to see content
5. Try the "Surprise Me" button for random discovery

### Run servers separately

#### Backend only:
```bash
npm run server:dev
```

#### Frontend only:
```bash
npm run client:dev
```

## Building for Production

### Build both:
```bash
npm run build
```

### Build server:
```bash
npm run server:build
```

### Build client:
```bash
npm run client:build
```

## API Endpoints

**Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`

**Cities**: `/api/cities` (GET/search), `/api/cities/:id`, `/api/cities/random/pick`, `/api/cities/:id/posts`, `/api/cities/:id/users`

**External APIs**: `/api/external/wiki/:cityId`, `/api/external/youtube/:cityId`, `/api/external/news/:cityId`

**Posts**: `/api/posts` (GET/POST), `/api/posts/:id` (GET/PUT/DELETE), `/api/posts/:id/like`, `/api/posts/:id/comment`, `/api/posts/:id/save`, `/api/posts/:postId/comment/:commentId` (PUT/DELETE), `/api/posts/saved/list`

**Blocking**: `/api/blocking/block/:userId`, `/api/blocking/unblock/:userId`, `/api/blocking/blocked`, `/api/blocking/is-blocked/:userId`

**Upload**: `/api/upload/image`, `/api/upload/images`, `/api/upload/profile-photo`

**Notifications**: `/api/notifications` (GET), `/api/notifications/unread/count`, `/api/notifications/:id/read`, `/api/notifications/read-all`

**Moderation**: `/api/moderation/pending`, `/api/moderation/posts/:id/approve`, `/api/moderation/posts/:id/reject`, `/api/moderation/flagged`

**Admin**: `/api/admin/stats`, `/api/admin/users`, `/api/admin/users/:id/role`, `/api/admin/moderators`, `/api/admin/posts/:id`

**Users/Connections/Messages**: See route files for complete list

## Socket.io Events

**Client → Server**: `send_message`, `typing`, `stop_typing`

**Server → Client**: `connected`, `receive_message`, `message_sent`, `user_typing`, `user_stop_typing`, `new_notification`, `user_online`, `user_offline`, `unread_notifications`

## Usage Guide

**Register**: Create account → choose city → add interests/languages → explore

**Explore Map**: Click cities to view 11 tabs (news/history/videos + 8 content types) or use "Surprise Me"

**Create Content**: Choose 1 of 8 post types → dynamic form adapts → submit for moderation → auto-scanned for spam

**Social**: Discover users → send friend requests → real-time messaging → block unwanted users

**Moderators**: Review pending/flagged posts → approve/reject with reasons (auto-flags highlighted)

**Admins**: System stats → manage users/roles → assign moderators to cities → full oversight

## Development Tips

**Hot Reload**: Enabled for both frontend and backend in dev mode

**Database Reset**: `mongo cultural-exchange --eval "db.dropDatabase()"`

**Type Check**: `cd server && npm run build` or `cd client && npm run build`

**Auto-Moderation**: Flags spam, profanity, duplicates, excessive links (highlighted in moderator dashboard)

**Rate Limiting**: Disabled in dev, auto-enabled in production (100 req/15min API, 5/15min auth, 10/hr upload, 20/hr posts, 50/hr messages)

## Troubleshooting

**MongoDB**: Ensure running (`sudo systemctl status mongod`) or check Atlas connection string

**Port in use**: Change PORT in `server/.env` or port in `client/vite.config.ts`

**CORS**: Match CLIENT_URL in server/.env to frontend URL

**External APIs**: Verify keys in `.env` (YouTube/News) - app works without them

**Image uploads**: Check Cloudinary credentials, max 5MB, images only

## Features Implemented ✅

✅ Interactive map • External APIs (Wiki/YouTube/News) • 8 content types • Moderation + auto-flagging • Admin/moderator dashboards • Image uploads • Rate limiting • Real-time notifications • Real-time messaging • Friend connections • User blocking • Post bookmarking • Privacy enforcement • Role-based access

See [FEATURE_STATUS.md](./FEATURE_STATUS.md) for detailed breakdown (90/160 features = 56.3% complete)

## Future Enhancements

Password reset • Email notifications • Full-text search • Testing suite • Docker • Rich text editor • Dark mode • Analytics • See FEATURE_STATUS.md for complete list

## License

MIT
