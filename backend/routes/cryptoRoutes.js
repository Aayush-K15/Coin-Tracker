const express = require("express");
const axios = require("axios");
const Joi = require("joi");
require("dotenv").config();
const db = require("../config/db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// Fetch only the top cryptos
const TOP_CRYPTO_IDS = ["BTC", "ETH", "USDT", "BNB", "DOGE", "SOL", "XRP", "ADA", "AVAX", "TRX"];

router.get("/top-cryptos", async (req, res) => {
  try {
    const response = await axios.get(
      `https://rest.coinapi.io/v1/assets?filter_asset_id=${TOP_CRYPTO_IDS.join(",")}`,
      { headers: { "X-CoinAPI-Key": process.env.COINAPI_KEY } }
    );

    const cryptos = response.data.map((crypto) => ({
      asset_id: crypto.asset_id,
      name: crypto.name,
      price_usd: crypto.price_usd,
      volume_1day_usd: crypto.volume_1day_usd || 0,
    }));

    res.status(200).json({ success: true, data: cryptos });
  } catch (error) {
    console.error("CoinAPI Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: "Failed to fetch cryptocurrency data." });
  }
});
router.post("/watchlist/add-multiple", authenticateToken, async (req, res) => {
  const user_id = req.user.user_id;
  const { asset_ids } = req.body; // expects: { asset_ids: ["BTC", "ETH", ...] }
  console.log("Adding to watchlist:", { user_id, asset_ids });
  console.log("Decoded User:", req.user);
  console.log(`🛠️ Attempting to add assets to watchlist for user ID ${user_id}: ${asset_ids.join(", ")}`);

  if (!Array.isArray(asset_ids) || asset_ids.length === 0) {
    return res.status(400).json({ success: false, error: "No assets provided." });
  }

  try {
    // Get all existing entries for this user
    const [existingRows] = await db.query(
      "SELECT asset_id FROM watchlist WHERE user_id = ?",
      [user_id]
    );
    const existingSet = new Set(existingRows.map(row => row.asset_id));
    console.log("Existing watchlist:", [...existingSet]);

    // Filter out duplicates
    const newAssets = asset_ids.filter(id => !existingSet.has(id));
    console.log("Filtered new assets (not in DB):", newAssets);

    if (newAssets.length === 0) {
      return res.status(409).json({ success: false, error: "All assets already in watchlist." });
    }

    // Format values for bulk insert
    const values = newAssets.map(asset_id => [user_id, asset_id]);
    await db.query("INSERT INTO watchlist (user_id, asset_id) VALUES ?", [values]);
    console.log(`✅ User ID ${user_id} added to watchlist: ${newAssets.join(", ")}`);
    console.log(`✅ Successfully added to watchlist for user ID ${user_id}: ${newAssets.join(", ")}`);
    console.log(`🧾 Watchlist Addition Summary for ${req.user.email} (ID: ${user_id}): ${newAssets.join(", ")}`);

    res.status(200).json({ success: true, message: `${newAssets.length} asset(s) added to watchlist.` });
  } catch (error) {
    console.error("Bulk insert error:", error);
    res.status(500).json({ success: false, error: "Failed to add cryptos to watchlist." });
  }
});

// Add crypto to watchlist (Prevents duplicates)
router.post("/watchlist/add", authenticateToken, async (req, res) => {
  const user_id = req.user.user_id;
  const { asset_id } = req.body;
  console.log("Decoded User:", req.user);

  const schema = Joi.object({
    asset_id: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  try {
    console.log("Adding to watchlist:", { user_id, asset_id });

    const [existing] = await db.query(
      "SELECT * FROM watchlist WHERE user_id = ? AND asset_id = ?",
      [user_id, asset_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: "Crypto already in watchlist." });
    }

    await db.query(
      "INSERT INTO watchlist (user_id, asset_id) VALUES (?, ?)",
      [user_id, asset_id]
    );
    console.log(`✅ User ID ${user_id} added to watchlist: ${asset_id}`);

    res.status(200).json({ success: true, message: "Crypto added to watchlist." });
  } catch (error) {
    console.error("🔥 DB Insert Error:", error); // Log the actual error
    res.status(500).json({ success: false, error: "Failed to add crypto to watchlist." });
  }
});

// Remove crypto from watchlist
router.delete("/watchlist/remove", authenticateToken, async (req, res) => {
  const user_id = req.user.user_id;
  const { asset_id } = req.body;

  const schema = Joi.object({
    asset_id: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  if (!asset_id) return res.status(400).json({ success: false, error: "Asset ID is required." });

  try {
    const [result] = await db.query("DELETE FROM watchlist WHERE user_id = ? AND asset_id = ?", [user_id, asset_id]);

    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Crypto not found in watchlist." });

    res.status(200).json({ success: true, message: "Crypto removed from watchlist." });
    console.log(`🗑️ User ID ${user_id} removed from watchlist: ${asset_id}`);
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ success: false, error: "Failed to remove crypto from watchlist." });
  }
});

// Fetch user's watchlist with live prices
router.get("/watchlist", authenticateToken, async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const [rows] = await db.query("SELECT asset_id FROM watchlist WHERE user_id = ?", [user_id]);
    const assetIds = rows.map((row) => row.asset_id);

    if (assetIds.length === 0) return res.status(200).json({ success: true, data: [] });

    const response = await axios.get(
      `https://rest.coinapi.io/v1/assets?filter_asset_id=${assetIds.join(",")}`,
      { headers: { "X-CoinAPI-Key": process.env.COINAPI_KEY } }
    );

    const cryptos = response.data.map((crypto) => ({
      asset_id: crypto.asset_id,
      name: crypto.name,
      price_usd: crypto.price_usd,
      percent_change_24h: crypto.change_percent_24h, // <-- real data
    }))

    res.status(200).json({ success: true, data: cryptos });
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    res.status(500).json({ success: false, error: "Failed to fetch watchlist." });
  }
});

// Add crypto to portfolio (Prevents duplicates)
router.post("/portfolio/add", authenticateToken, async (req, res) => {
  const user_id = req.user.user_id;
  const { asset_id, purchase_price, purchase_date, quantity } = req.body;

  const schema = Joi.object({
    asset_id: Joi.string().required(),
    purchase_price: Joi.number().positive().required(),
    purchase_date: Joi.date().required(),
    quantity: Joi.number().positive().required()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  try {
    const [existing] = await db.query("SELECT * FROM portfolio WHERE user_id = ? AND asset_id = ?", [user_id, asset_id]);
    if (existing.length > 0) return res.status(409).json({ success: false, error: "Crypto already in portfolio." });

    await db.query(
      "INSERT INTO portfolio (user_id, asset_id, purchase_price, purchase_date, quantity) VALUES (?, ?, ?, ?, ?)",
      [user_id, asset_id, purchase_price, purchase_date, quantity]
    );
    console.log(`✅ User ID ${user_id} added to portfolio: ${asset_id}, Quantity: ${quantity}, Price: ${purchase_price}`);

    res.status(200).json({ success: true, message: "Crypto added to portfolio." });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ success: false, error: "Failed to add crypto to portfolio." });
  }
});

// Fetch user's portfolio with live prices & profit/loss
router.get("/portfolio", authenticateToken, async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const [rows] = await db.query(
      "SELECT asset_id, purchase_price, purchase_date, quantity FROM portfolio WHERE user_id = ?",
      [user_id]
    );

    if (rows.length === 0) return res.status(200).json({ success: true, data: [] });

    const assetIds = rows.map((row) => row.asset_id);

    const response = await axios.get(
      `https://rest.coinapi.io/v1/assets?filter_asset_id=${assetIds.join(",")}`,
      { headers: { "X-CoinAPI-Key": process.env.COINAPI_KEY } }
    );

    const cryptoPrices = response.data.reduce((acc, crypto) => {
      acc[crypto.asset_id] = crypto.price_usd;
      return acc;
    }, {});

    const portfolio = rows.map((entry) => {
      const current_price = cryptoPrices[entry.asset_id] || null;
      const profit_loss = current_price ? (current_price - entry.purchase_price) * entry.quantity : null;

      return {
        asset_id: entry.asset_id,
        purchase_price: entry.purchase_price,
        purchase_date: entry.purchase_date,
        quantity: entry.quantity,
        current_price,
        profit_loss,
      };
    });

    const { sort, order } = req.query;
    if (sort && ["profit_loss", "current_price", "purchase_price"].includes(sort)) {
      portfolio.sort((a, b) => {
        const valA = a[sort] ?? 0;
        const valB = b[sort] ?? 0;
        return order === "desc" ? valB - valA : valA - valB;
      });
    }

    res.status(200).json({ success: true, data: portfolio });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ success: false, error: "Failed to fetch portfolio." });
  }
});

// Remove crypto from portfolio
router.delete("/portfolio/remove", authenticateToken, async (req, res) => {
  const user_id = req.user.user_id;
  const { asset_id } = req.body;

  const schema = Joi.object({
    asset_id: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  if (!asset_id) return res.status(400).json({ success: false, error: "Asset ID is required." });

  try {
    const [result] = await db.query("DELETE FROM portfolio WHERE user_id = ? AND asset_id = ?", [user_id, asset_id]);

    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Crypto not found in portfolio." });

    res.status(200).json({ success: true, message: "Crypto removed from portfolio." });
    console.log(`🗑️ User ID ${user_id} removed from portfolio: ${asset_id}`);
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ success: false, error: "Failed to remove crypto from portfolio." });
  }
});

// Health check route
router.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is running fine!" });
});

module.exports = router;