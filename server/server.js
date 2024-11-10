const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

// API route
app.get('/api', (req, res) => {
  res.json({ users: ['user1', 'user2', 'user3', 'user5'] });
});

// The "catchall" handler: For any request that doesn't match "/api", send back React's index.html
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});