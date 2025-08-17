# Prompt for environment variables if .env does not exist
if [ ! -f backend/.env ]; then
  echo "🔧 .env file not found. Let's set it up."

  read -p "Enter DB_HOST (e.g. 127.0.0.1): " DB_HOST
  read -p "Enter DB_USER (e.g. root): " DB_USER
  read -p "Enter DB_PASSWORD: " DB_PASSWORD
  read -p "Enter DB_NAME (e.g. crypto_tracker): " DB_NAME
  read -p "Enter COINAPI_KEY: " COINAPI_KEY
  read -p "Enter JWT_SECRET: " JWT_SECRET
  read -p "Enter EMAIL_HOST (e.g. smtp.gmail.com): " EMAIL_HOST
  read -p "Enter EMAIL_PORT (e.g. 465): " EMAIL_PORT
  read -p "Enter EMAIL_SECURE (true/false): " EMAIL_SECURE
  read -p "Enter EMAIL_USER (e.g. your email): " EMAIL_USER
  read -sp "Enter EMAIL_PASS (input hidden): " EMAIL_PASS
  echo ""

  cat <<EOF > backend/.env
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
COINAPI_KEY=$COINAPI_KEY
JWT_SECRET=$JWT_SECRET
EMAIL_HOST=$EMAIL_HOST
EMAIL_PORT=$EMAIL_PORT
EMAIL_SECURE=$EMAIL_SECURE
EMAIL_USER=$EMAIL_USER
EMAIL_PASS=$EMAIL_PASS
EOF

  echo "✅ .env file created successfully."
fi

# Run DB setup
echo "📦 Running initial DB setup..."
node backend/config/dbSetup.js
(cd backend && node server.js &) & (cd frontend && npm start)
