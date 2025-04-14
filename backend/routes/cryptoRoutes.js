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
    // Fetch current prices
    const response = await axios.get(
      `https://rest.coinapi.io/v1/assets?filter_asset_id=${TOP_CRYPTO_IDS.join(",")}`,
      { headers: { "X-CoinAPI-Key": process.env.COINAPI_KEY } }
    );

    // For each crypto, fetch 24h historical data
    const cryptosWithChanges = await Promise.all(
      response.data.map(async (crypto) => {
        try {
          // Get price from 24 hours ago
          const historicalResponse = await axios.get(
            `https://rest.coinapi.io/v1/ohlcv/${crypto.asset_id}_USD/history?period_id=1DAY&limit=2`,
            { headers: { "X-CoinAPI-Key": process.env.COINAPI_KEY } }
          );
          
          let change_percent_24h = 0;
          if (historicalResponse.data && historicalResponse.data.length > 0) {
            const yesterday_price = historicalResponse.data[0].price_close;
            change_percent_24h = ((crypto.price_usd - yesterday_price) / yesterday_price) * 100;
          }
          
          return {
            asset_id: crypto.asset_id,
            name: crypto.name,
            price_usd: crypto.price_usd,
            volume_1day_usd: crypto.volume_1day_usd || 0,
            change_percent_24h,
            market_cap_usd: crypto.market_cap_usd || (crypto.price_usd * 21000000) // Fallback calculation for BTC
          };
        } catch (err) {
          return {
            asset_id: crypto.asset_id,
            name: crypto.name,
            price_usd: crypto.price_usd,
            volume_1day_usd: crypto.volume_1day_usd || 0,
            change_percent_24h: 0,
            market_cap_usd: crypto.market_cap_usd || (crypto.price_usd * 21000000) // Fallback calculation for BTC
          };
        }
      })
    );

    res.status(200).json({ success: true, data: cryptosWithChanges });
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
      change_percent_24h: crypto.percent_change_24h, // <-- real data
    }))
    console.log("Raw CoinAPI response for " + crypto.asset_id + ":", crypto);
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
    console.log("🧾 Adding to portfolio:", { user_id, asset_id, purchase_price, purchase_date, quantity });
    await db.query(
      "INSERT INTO portfolio (user_id, asset_id, purchase_price, purchase_date, quantity) VALUES (?, ?, ?, ?, ?)",
      [user_id, asset_id, purchase_price, purchase_date, quantity]
    );
    console.log(`✅ User ID ${user_id} added to portfolio: ${asset_id}, Quantity: ${quantity}, Price: ${purchase_price}`);

    res.status(200).json({ success: true, message: "Crypto added to portfolio." });
  } catch (error) {
    console.error("🔥 Database Error (Add to Portfolio):", error); // Add this
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
router.get("/historical/:asset_id", authenticateToken, async (req, res) => {
  const { asset_id } = req.params;
  const { period = "1DAY", limit = 30, exchange = "COINBASE" } = req.query;

  try {
    // Convert asset to CoinAPI's symbol format
    const symbol_id = `${exchange}_SPOT_${asset_id}_USD`;
    
    // Calculate time period
    const periods = {
      "1H": "1HRS",
      "1DAY": "1DAY",
      "1W": "1WEEK",
      "1M": "1MTH",
      "1Y": "1YEAR"
    };
    
    const period_id = periods[period] || "1DAY";
    const now = new Date();
    let time_start;
    
    switch (period) {
      case "1H":
        time_start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // last 24 hours
        break;
      case "1DAY":
        time_start = new Date(now.getTime() - limit * 24 * 60 * 60 * 1000); // 'limit' days ago
        break;
      case "1W":
        time_start = new Date(now.getTime() - limit * 7 * 24 * 60 * 60 * 1000); // 'limit' weeks ago
        break;
      case "1M":
        time_start = new Date(now.getTime() - limit * 30 * 24 * 60 * 60 * 1000); // approx months
        break;
      case "1Y":
        time_start = new Date(now.getTime() - limit * 365 * 24 * 60 * 60 * 1000); // approx years
        break;
      default:
        time_start = new Date(now.getTime() - limit * 24 * 60 * 60 * 1000); // fallback
    }
    
    const startDate = time_start.toISOString();

    const response = await axios.get(
      `https://rest.coinapi.io/v1/ohlcv/${symbol_id}/history`,
      {
        params: {
          period_id: period_id,
          time_start: startDate,
          limit: limit,
          include_empty_items: false
        },
        headers: { 
          "X-CoinAPI-Key": process.env.COINAPI_KEY,
          "Accept-Encoding": "gzip"
        }
      }
    );

    if (!response.data || response.data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "No historical data found for this asset" 
      });
    }

    const historicalData = response.data.map(item => ({
      time: item.time_period_start,
      open: item.price_open,
      high: item.price_high,
      low: item.price_low,
      close: item.price_close,
      volume: item.volume_traded
    }));

    res.status(200).json({ success: true, data: historicalData });

  } catch (error) {
    console.error("Historical Data Error:", {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    
    let errorMessage = "Failed to fetch historical data";
    if (error.response?.status === 404) {
      errorMessage = "This asset/exchange combination not found. Try different exchange.";
    }
    
    res.status(error.response?.status || 500).json({ 
      success: false, 
      error: errorMessage,
      hint: "Try adding ?exchange=COINBASE or ?exchange=BITSTAMP to your request"
    });
  }
});

module.exports = router;