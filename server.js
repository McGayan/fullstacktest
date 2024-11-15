const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const ServiceController = require("./controllers/appcontroller");

app.use(express.json());
app.use(cors());

const appController = new ServiceController();

appController.init().then(() => {
	console.log('database and container created Successfully'); }).catch((err) => {
		console.log(`Database and container creation failed\nException: ${err}`);
		process.exit(1);
	});


// Serve static files from the React app
app.use(express.static(path.join(__dirname, './client/build')));

// API route
app.get('/api', (req, res) => {
  res.json({ users: ['user1', 'user2', 'user3', 'user5'] });
});

// The "catchall" handler: For any request that doesn't match "/api", send back React's index.html
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.post("/exprec", async(req, res) => {
	const data = req.body;
	console.log('Received POST request:', data);
	let addResponce = await appController.addProduct(data);
	res.json({ message: 'Data received successfully', receivedData: addResponce });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});