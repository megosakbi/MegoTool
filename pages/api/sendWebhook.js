export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { message } = req.body;
  if (!message) return res.status(400).json({ message: 'No message provided' });

  try {
    await fetch(process.env.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
    return res.status(200).json({ message: 'Sent!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error sending webhook' });
  }
}
