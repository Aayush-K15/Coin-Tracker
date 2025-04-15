const path = require("path");
const dotenv = require("dotenv");
const mysql = require("mysql2");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

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

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

const createDatabaseAndTables = () => {
    db.connect((err) => {
        if (err) throw err;

        db.query("CREATE DATABASE IF NOT EXISTS crypto_tracker", (err) => {
            if (err) throw err;

            db.changeUser({ database: "crypto_tracker" }, (err) => {
                if (err) throw err;

                const usersTable = `CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    dob DATE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    email_verified BOOLEAN DEFAULT 0,
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

                const emailverification= `CREATE TABLE email_verifications (
                    email VARCHAR(255) PRIMARY KEY,
                    code VARCHAR(6) NOT NULL,
                    expires_at DATETIME NOT NULL
                  )`;
                  

                db.query(usersTable, (err) => { if (err) throw err; });
                db.query(watchlistTable, (err) => { if (err) throw err; });
                db.query(portfolioTable, (err) => { if (err) throw err; });
                db.query(emailverification, (err) => { if (err) throw err; });

                db.end();
            });
        });
    });
};

createDatabaseAndTables();