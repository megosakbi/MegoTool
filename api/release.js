export default async function handler(req, res) {

  if(req.method !== "POST"){
    return res.status(405).json({error:"Only POST allowed"});
  }

  try{

    const { text } = req.body;

    const webhook = process.env.WEBHOOK_URL;

    if(!webhook){
      return res.status(500).json({
        error:"WEBHOOK_URL is not set"
      });
    }

    const response = await fetch(webhook,{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        text:text
      })
    });

    const result = await response.text();

    res.status(200).json({
      success:true,
      webhookResponse: result
    });

  }catch(err){

    res.status(500).json({
      error: err.message
    });

  }

}
