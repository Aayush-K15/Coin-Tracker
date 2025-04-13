const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = (req, res, next) => {
  console.log("Auth Headers:", req.headers);
  const authHeader = req.header("Authorization");
  console.log("Auth Header:", authHeader);
  
  const token = authHeader?.split(" ")[1];
  console.log("Extracted Token:", token ? `${token.substring(0, 10)}...` : "No token");

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

module.exports = authenticateToken;
