const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const commentRoutes = require('./routes/comments');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// Mount routes
app.use('/comments', commentRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
