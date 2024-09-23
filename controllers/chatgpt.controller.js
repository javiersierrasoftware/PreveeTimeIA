const axios = require('axios');

const getChatGPTResponse = async (req, res) => {
  const { message } = req.body;
  console.log('API Key:', process.env.OPENAI_API_KEY); // Para verificar que la clave API se está cargando correctamente

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [{ role: 'user', content: message }]
    }, {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
    });

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('Error with ChatGPT API:', error.response ? error.response.data : error.message);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  getChatGPTResponse,
};