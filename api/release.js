export default async function handler(req, res) {

    if(req.method !== "POST"){
        return res.status(405).json({message:"Method not allowed"});
    }

    const { text } = req.body;

    try{

        const webhook = process.env.WEBHOOK_URL;

        const response = await fetch(webhook,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                text:text
            })
        });

        if(!response.ok){
            throw new Error("Webhook error");
        }

        res.status(200).json({message:"Text released successfully"});

    }catch(err){

        res.status(500).json({
            message:"Error sending to webhook"
        });

    }

}
