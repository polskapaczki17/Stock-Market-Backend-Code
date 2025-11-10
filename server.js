import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Market Data API is running!");
});

// ===================================================================
// 📈 STOCKS — via Alpaca Market Data
// ===================================================================
app.get("/api/stocks", async (req, res) => {
  const symbols = req.query.symbols || "AAPL,MSFT,TSLA,GOOGL";
  const url = `https://data.alpaca.markets/v2/stocks/snapshots?symbols=${symbols}`;

  try {
    const response = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID": process.env.ALPACA_KEY_ID,
        "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY,
      },
    });
    const data = await response.json();

    const simplified = {};
    for (const [symbol, info] of Object.entries(data)) {
      simplified[symbol] = {
        price: info.latestTrade?.p ?? null,
        high: info.dailyBar?.h ?? null,
        low: info.dailyBar?.l ?? null,
        close: info.dailyBar?.c ?? null,
        volume: info.dailyBar?.v ?? null,
        time: info.latestTrade?.t ?? null,
      };
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(simplified);
  } catch (err) {
    console.error("Stocks error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// 💰 CRYPTO — via Alpaca Crypto Feed (global)
// ===================================================================
app.get("/api/crypto", async (req, res) => {
  const symbols = req.query.symbols || "BTC/USD,ETH/USD";
  const url = `https://data.alpaca.markets/v1beta3/crypto/latest/snapshots?symbols=${symbols}`;

  try {
    const response = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID": process.env.ALPACA_KEY_ID,
        "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY,
      },
    });
    const data = await response.json();

    const simplified = {};
    if (data.snapshots) {
      for (const [symbol, info] of Object.entries(data.snapshots)) {
        simplified[symbol] = {
          price: info.latestTrade?.p ?? null,
          high: info.dailyBar?.h ?? null,
          low: info.dailyBar?.l ?? null,
          volume: info.dailyBar?.v ?? null,
          time: info.latestTrade?.t ?? null,
        };
      }
    } else {
      console.warn("⚠️ No crypto snapshots found:", data);
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(simplified);
  } catch (err) {
    console.error("Crypto error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// 🪙 PRECIOUS METALS — via TwelveData
// ===================================================================
app.get("/api/metals", async (req, res) => {
  const symbols = req.query.symbols || "XAU/USD,XAG/USD";
  const url = `https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${process.env.TWELVE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const simplified = {};

    if (data.symbol) {
      simplified[data.symbol] = {
        price: parseFloat(data.close),
        high: parseFloat(data.high),
        low: parseFloat(data.low),
        change: parseFloat(data.percent_change),
        time: data.datetime,
      };
    } else {
      // multi-symbol format
      for (const [symbol, info] of Object.entries(data)) {
        if (info && info.close) {
          simplified[symbol] = {
            price: parseFloat(info.close),
            high: parseFloat(info.high),
            low: parseFloat(info.low),
            change: parseFloat(info.percent_change),
            time: info.datetime,
          };
        }
      }
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(simplified);
  } catch (err) {
    console.error("Metals error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// 🚀 START SERVER
// ===================================================================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
