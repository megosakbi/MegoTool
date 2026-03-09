export default async function handler(req, res) {
    if(req.method !== "POST") return res.status(405).json({error:"Method not allowed"});

    const { text } = req.body; // <-- odbieramy dokładnie to, co wpisze użytkownik

    if(!text) return res.status(400).json({error:"No text provided"});

    const webhook = process.env.WEBHOOK_URL; // <-- ukryty webhook w Vercel env

    try {
        await fetch(webhook, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ content: text }) // <-- wysyłamy dokładnie wpisany tekst
        });
        res.status(200).json({ success:true });
    } catch(err) {
        res.status(500).json({ error:"Webhook failed" });
    }
}
