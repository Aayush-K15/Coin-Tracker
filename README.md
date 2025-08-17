# CoinTracker 📈

A full-stack cryptocurrency portfolio tracking application built with Next.js and Node.js. Track your crypto investments, create watchlists, and monitor real-time prices all in one place.

## ✨ Features

- **Real-time Crypto Tracking**: Live price updates from CoinAPI
- **Portfolio Management**: Add, track, and manage your cryptocurrency investments
- **Smart Watchlists**: Monitor your favorite cryptocurrencies
- **User Authentication**: Secure registration and login with email verification
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Mode**: Toggle between themes for better user experience

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Recharts** - Data visualization library
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Joi** - Server-side validation
- **Nodemailer** - Email service

### External APIs
- **CoinAPI** - Real-time cryptocurrency data

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or pnpm package manager
- CoinAPI key (free tier available)

## 🚀 Quick Start

### Option 1: Using the Setup Script (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd CoinTracker
```

2. Make the setup script executable and run it:
```bash
chmod +x run.sh
./run.sh
```

The script will:
- Prompt you for environment variables
- Create the `.env` file
- Set up the database and tables
- Install dependencies
- Start both frontend and backend servers

### Option 2: Manual Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd CoinTracker

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

2. **Set up environment variables:**

Create `backend/.env`:
```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=crypto_tracker
COINAPI_KEY=your_coinapi_key
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

3. **Set up the database:**
```bash
cd backend
node config/dbSetup.js
```

4. **Start the development servers:**

Backend (from `backend/` directory):
```bash
npm run dev
```

Frontend (from `frontend/` directory):
```bash
npm run dev
```

## 📁 Project Structure

```
CoinTracker/
├── backend/
│   ├── config/
│   │   ├── db.js              # Database connection
│   │   └── dbSetup.js         # Database initialization
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── models/
│   │   └── userModel.js       # User model
│   ├── routes/
│   │   ├── authRoutes.js      # Authentication endpoints
│   │   └── cryptoRoutes.js    # Cryptocurrency endpoints
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Express server entry point
├── frontend/
│   ├── app/
│   │   ├── api/               # Next.js API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   └── ui/                # Reusable UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   ├── styles/                # Additional styles
│   ├── utils/                 # Helper functions
│   ├── .env.local             # Frontend environment variables
│   ├── next.config.mjs        # Next.js configuration
│   ├── package.json
│   ├── tailwind.config.ts     # Tailwind configuration
│   └── tsconfig.json          # TypeScript configuration
└── run.sh                     # Setup script
```

## 🔑 Environment Variables

### Backend (`backend/.env`)
- `DB_HOST` - MySQL host (default: 127.0.0.1)
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name (default: crypto_tracker)
- `COINAPI_KEY` - Your CoinAPI key
- `JWT_SECRET` - Secret for JWT tokens
- `EMAIL_HOST` - SMTP host for email service
- `EMAIL_PORT` - SMTP port
- `EMAIL_SECURE` - Use SSL/TLS (true/false)
- `EMAIL_USER` - Email username
- `EMAIL_PASS` - Email password/app password

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## 📊 Database Schema

The application uses MySQL with the following main tables:

- **users** - User accounts and profiles
- **watchlist** - User's cryptocurrency watchlist
- **portfolio** - User's cryptocurrency holdings
- **email_verifications** - Email verification codes

## 🔐 Authentication Flow

1. User registers with email and password
2. Email verification code is sent
3. User verifies email to activate account
4. JWT tokens are used for authenticated requests
5. Protected routes require valid authentication

## 🎨 UI Components

The frontend uses a comprehensive component library built on Radix UI:

- [`Card`](frontend/components/ui/card.tsx) - Content containers
- [`Button`](frontend/components/ui/button.tsx) - Interactive elements
- [`Form`](frontend/components/ui/form.tsx) - Form components with validation
- [`Table`](frontend/components/ui/table.tsx) - Data tables
- [`Dialog`](frontend/components/ui/dialog.tsx) - Modal dialogs
- [`Toast`](frontend/components/ui/toast.tsx) - Notifications
- [`Sidebar`](frontend/components/ui/sidebar.tsx) - Navigation sidebar

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get user profile

### Cryptocurrency
- `GET /api/crypto/top-cryptos` - Get top cryptocurrencies
- `GET /api/crypto/watchlist` - Get user's watchlist
- `POST /api/crypto/watchlist/add` - Add to watchlist
- `DELETE /api/crypto/watchlist/remove` - Remove from watchlist
- `GET /api/crypto/portfolio` - Get user's portfolio
- `POST /api/crypto/portfolio/add` - Add to portfolio
- `DELETE /api/crypto/portfolio/remove` - Remove from portfolio

## 🚢 Deployment

### Backend Deployment

1. Set up a MySQL database
2. Configure environment variables
3. Run database setup: `node config/dbSetup.js`
4. Start the server: `npm start`

### Frontend Deployment

1. Build the application: `npm run build`
2. Deploy to your preferred platform (Vercel, Netlify, etc.)
3. Configure environment variables in your deployment platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure MySQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **Email Verification Not Working**
   - Check email service configuration
   - For Gmail, use App Passwords instead of regular password
   - Verify SMTP settings

3. **API Rate Limits**
   - CoinAPI has rate limits on free tier
   - Consider upgrading plan for production use

4. **CORS Issues**
   - Ensure frontend URL is properly configured in backend CORS settings

### Development Tips

- Use the [`useToast`](frontend/hooks/use-toast.ts) hook for user notifications
- Check [`backend/output.log`](backend/output.log) for server logs
- Use browser dev tools to inspect API calls
- Enable debug logging in development

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the console/server logs
3. Open an issue in the repository
4. Check API documentation for external services

---

Built with ❤️ using Next.js and Node.js