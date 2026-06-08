# 🌟 MetaPersona — Premium Digital Life Management Platform

MetaPersona is a full-stack web application that serves as your complete digital life hub. Store, organize, edit, and protect your personal information, career history, academic journey, memories, goals, and sensitive private data in one beautifully crafted, secure dashboard.

---

## ✨ Features

- **🔐 JWT Authentication** — Secure signup/login with bcrypt password hashing
- **👤 Personal Info** — Bio, contact, social links, skills, languages, interests
- **📚 Education** — Academic history with degrees, grades, and descriptions
- **💼 Career** — Work experience tracker with current job indicator
- **🏆 Achievements** — Awards, certificates, and proud moments
- **📅 Life Timeline** — Event-by-event story of your life
- **🎯 Goals Planner** — Set goals, track progress with status and priority
- **⭐ Memory Vault** — Preserve precious memories with moods, locations, and tags
- **📄 Documents** — Store references to your important documents
- **🔒 Private Folders** — Password-protected encrypted folders for sensitive data
- **👑 Admin Panel** — User management, analytics, and controls
- **📱 Fully Responsive** — Works on mobile, tablet, laptop, and desktop

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt |
| Security | Rate limiting, Input validation |

---

## 📦 Project Structure

```
meta-persona/
├── server.js              # Express server entry point
├── package.json
├── .env                   # Environment variables (create from .env.example)
├── .env.example           # Environment template
├── .gitignore
│
├── models/
│   ├── User.js            # User authentication model
│   ├── Profile.js         # Full life profile model
│   └── PrivateFolder.js   # Encrypted folder model
│
├── routes/
│   ├── auth.js            # Auth routes (signup, login, me)
│   ├── profile.js         # Profile CRUD routes
│   ├── folders.js         # Private folder routes
│   └── admin.js           # Admin panel routes
│
├── middleware/
│   └── auth.js            # JWT protect + admin guard middleware
│
├── uploads/               # Uploaded files (auto-created)
│
└── public/
    ├── index.html         # Landing page + Auth modal
    ├── dashboard.html     # Main dashboard
    ├── admin.html         # Admin panel
    │
    ├── css/
    │   ├── global.css     # Design system, tokens, components
    │   ├── landing.css    # Landing page styles
    │   └── dashboard.css  # Dashboard layout styles
    │
    └── js/
        ├── utils.js       # API helper, Auth, Toast, modals
        ├── landing.js     # Landing page + auth logic
        └── dashboard.js   # Full dashboard application logic
```

---

## 🚀 Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally (or MongoDB Atlas)

### 1. Clone / Navigate to the project

```bash
cd "Meta Persona"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy the example env file
copy .env.example .env
```

Edit `.env` and set:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/metapersona
JWT_SECRET=your-super-secret-key-here
```

### 4. Start MongoDB

Make sure MongoDB is running locally:
```bash
# Windows (if installed as service)
net start MongoDB

# Or start mongod manually
mongod
```

### 5. Run the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 6. Open in Browser

```
http://localhost:5000
```

---

## 👑 Admin Setup

To create the first admin account, make a one-time POST request:

```bash
curl -X POST http://localhost:5000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Super Admin","email":"admin@metapersona.com","password":"Admin@123456"}'
```

Then login at `http://localhost:5000` with those credentials to access the admin panel.

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/change-password` | Change password |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get full profile |
| PUT | `/api/profile/personal-info` | Update personal info |
| GET/POST | `/api/profile/:section` | Get/Add items |
| PUT/DELETE | `/api/profile/:section/:id` | Edit/Delete item |

Sections: `education`, `career`, `achievements`, `timeline`, `goals`, `memories`, `documents`

### Private Folders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/folders` | List folders |
| POST | `/api/folders` | Create folder |
| POST | `/api/folders/:id/unlock` | Unlock folder |
| POST | `/api/folders/:id/items` | Add item |
| PUT | `/api/folders/:id/items/:itemId` | Edit item |
| DELETE | `/api/folders/:id/items/:itemId` | Delete item |
| PUT | `/api/folders/:id` | Rename/change password |
| DELETE | `/api/folders/:id` | Delete folder |

### Admin (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Analytics |
| GET | `/api/admin/users` | All users |
| PUT | `/api/admin/users/:id/toggle-active` | Toggle active |
| DELETE | `/api/admin/users/:id` | Delete user |

---

## 🔒 Security Features

- JWT tokens with 7-day expiry
- bcrypt password hashing (12 salt rounds)
- Rate limiting (200 general / 20 auth per 15 min)
- Protected routes via middleware
- Input validation on all endpoints
- Folder passwords separately hashed
- Token verification on every protected request

---

## 📱 Responsive Design

- **Mobile First** — Collapsible sidebar, touch-friendly buttons
- **Tablet** — Adaptive grid layouts
- **Desktop** — Full sidebar with rich dashboard
- **Large Screens** — Max-width containers for readability

---

## 🎨 Design System

- **Dark Mode** — Deep dark glassmorphism theme
- **Brand Colors** — Purple → Blue → Pink gradient
- **Typography** — Outfit (headings) + Inter (body)
- **Glassmorphism** — Frosted glass cards with subtle borders
- **Animations** — Smooth transitions, hover effects, toast notifications
- **Micro-interactions** — Button glow, card lift, folder unlock shake

---

Built with ❤️ by MetaPersona Team
