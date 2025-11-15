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
// 📈 REAL-TIME STOCKS — via Alpaca Market Data
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
      const latestPrice = info.latestTrade?.p || info.dailyBar?.c || null;
      const prevClose = info.prevDailyBar?.c || null;

      simplified[symbol] = {
        price: latestPrice,
        change: (latestPrice && prevClose) ? (latestPrice - prevClose) : null,
        percentChange: (latestPrice && prevClose)
          ? (((latestPrice - prevClose) / prevClose) * 100).toFixed(2)
          : null,
        high: info.dailyBar?.h || null,
        low: info.dailyBar?.l || null,
        volume: info.minuteBar?.v || null,
        time: info.latestTrade?.t || null,
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
// 💰 REAL-TIME CRYPTO — via Alpaca Crypto Feed
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
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(simplified);
  } catch (err) {
    console.error("Crypto error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// 📜 HISTORICAL STOCK DATA — Alpaca v2 Bars
// ===================================================================
app.get("/api/history/stocks", async (req, res) => {
  const symbol = req.query.symbol || "AAPL";
  const timeframe = req.query.timeframe || "1D"; // 1Min,5Min,15Min,1H,1D
  const limit = req.query.limit || 30;

  const url =
    `https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=${timeframe}&limit=${limit}`;

  try {
    const response = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID": process.env.ALPACA_KEY_ID,
        "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY,
      },
    });

    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(data);
  } catch (err) {
    console.error("History stocks error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// 📜 HISTORICAL CRYPTO DATA — Alpaca Crypto v1 Bars
// ===================================================================
app.get("/api/history/crypto", async (req, res) => {
  const symbol = req.query.symbol || "BTC";
  const timeframe = req.query.timeframe || "1D"; // 1Min,5Min,15Min,1H,1D
  const limit = req.query.limit || 30;

  const url =
    `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${symbol}/USD&timeframe=${timeframe}&limit=${limit}`;

  try {
    const response = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID": process.env.ALPACA_KEY_ID,
        "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY,
      },
    });

    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(data);
  } catch (err) {
    console.error("History crypto error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// 🚀 START SERVER
// ===================================================================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
