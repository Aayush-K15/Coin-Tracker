const path = require("path");
const dotenv = require("dotenv");

// Manually assign .env variables to process.env
const envConfig = dotenv.config({ path: path.resolve(__dirname, "../.env") });
if (envConfig.error) {
    console.error("Error loading .env file:", envConfig.error);
} else {
    console.log("Environment Variables Loaded:", envConfig.parsed);
}

// Debugging
console.log("DB_USER from dbSetup.js:", process.env.DB_USER);

const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "cointracker",
});

connection.connect((err) => {
    if (err) {
        console.error("Database Connection Failed:", err);
    } else {
        console.log("Database Connected Successfully!");
    }
});

module.exports = connection;
connection.connect((err) => {
    if (err) {
        console.error("Database Connection Failed:", err);
    } else {
        console.log("Database Connected Successfully!");
    }
});

module.exports = connection;

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

const createDatabaseAndTables = () => {
    db.connect((err) => {
        if (err) throw err;
        console.log("Connected to MySQL!");

        db.query("CREATE DATABASE IF NOT EXISTS crypto_tracker", (err) => {
            if (err) throw err;
            console.log("Database created or exists already.");

            db.changeUser({ database: "crypto_tracker" }, (err) => {
                if (err) throw err;

                const usersTable = `CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    dob DATE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`;

                const watchlistTable = `CREATE TABLE IF NOT EXISTS watchlist (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    asset_id VARCHAR(10) NOT NULL,
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )`;

                const portfolioTable = `CREATE TABLE IF NOT EXISTS portfolio (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    asset_id VARCHAR(10) NOT NULL,
                    purchase_price DECIMAL(18, 8) NOT NULL,
                    purchase_date DATE NOT NULL,
                    quantity DECIMAL(18, 8) NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )`;

                db.query(usersTable, (err) => {
                    if (err) throw err;
                    console.log("Users table ready.");
                });

                db.query(watchlistTable, (err) => {
                    if (err) throw err;
                    console.log("Watchlist table ready.");
                });

                db.query(portfolioTable, (err) => {
                    if (err) throw err;
                    console.log("Portfolio table ready.");
                });

                db.end();
            });
        });
    });
};

createDatabaseAndTables();