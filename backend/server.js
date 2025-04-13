const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const cryptoRoutes = require("./routes/cryptoRoutes");
const app = express();

app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/crypto", cryptoRoutes);


app.get("/", (req, res) => {
    res.send("CoinTracker API is running 🚀");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));