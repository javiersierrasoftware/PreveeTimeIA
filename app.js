require('dotenv').config(); // Esto debe estar al principio
const express = require('express');
const bodyParser = require('body-parser');
const chatgptRoute = require('./routes/chatgpt.route');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.use('/api', chatgptRoute);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

