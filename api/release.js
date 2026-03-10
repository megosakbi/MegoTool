export default async function handler(req, res) {

  const { text } = req.body;

  try {

    const response = await fetch(process.env.WEBHOOK_URL,{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({ text })
    });

    const data = await response.text();

    res.status(200).json({
      status: response.status,
      webhookResponse: data
    });

  } catch(err) {

    res.status(500).json({
      error: err.message
    });

  }

}
