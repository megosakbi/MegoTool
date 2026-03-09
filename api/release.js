export default async function handler(req, res) {

const webhook = process.env.WEBHOOK_URL

const {name, gameid, desc} = req.body

await fetch(webhook,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
content:
"🚀 **New Game Release**\n\n"+
"🎮 Game: "+name+"\n"+
"🆔 ID: "+gameid+"\n"+
"📄 Description: "+desc
})
})

res.status(200).json({status:"ok"})

}
