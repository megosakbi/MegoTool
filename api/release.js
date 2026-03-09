export default async function handler(req, res) {

if (req.method !== "POST") {
return res.status(405).json({ error: "Method not allowed" })
}

const { name, gameid, desc } = req.body

const webhook = process.env.WEBHOOK_URL

try {

await fetch(webhook, {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
content:
"🚀 **New Game Release**\n\n" +
"🎮 Game: " + name + "\n" +
"🆔 Game ID: " + gameid + "\n" +
"📄 Description: " + desc
})
})

res.status(200).json({ success: true })

} catch (error) {

res.status(500).json({ error: "Webhook failed" })

}

}
