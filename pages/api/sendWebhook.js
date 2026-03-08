// pages/api/sendWebhook.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Only POST allowed' });

  const { message } = req.body;

  if (!message) return res.status(400).json({ message: 'No message provided' });

  try {
    // Wysyłamy do webhooka, który jest ukryty w zmiennej środowiskowej
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
