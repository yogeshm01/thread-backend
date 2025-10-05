const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const path = require('path');
const commentRoutes = require('./routes/comments');

const app = express();
const PORT = process.env.PORT || 4000;

// Log where data will be written so it's easy to debug deployments (Render etc.)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'comments.json');
console.log('DATA_DIR=', DATA_DIR);
console.log('DATA_FILE=', DATA_FILE);

app.use(cors());
app.use(bodyParser.json());

// Mount routes
app.use('/comments', commentRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
