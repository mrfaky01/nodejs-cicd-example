const express = require('express');
const app = express();
const port = 3000; // Your application will listen on port 3000 inside the container

// Define the route for the root path '/'
app.get('/', (req, res) => {
  res.send('Hello from Jenkins CI/CD! This is the nodejs-cicd-example app - DEPLOYMENT AUTOMATED AND LIVE!');
});

// Start the server and make it listen on the specified port.
// CRITICAL CHANGE: Listen on '0.0.0.0' to accept connections from any IP address
// within the Docker container's network, not just the loopback interface (localhost).
app.listen(port, '0.0.0.0', () => {
  console.log(`Node.js CI/CD Example App listening at http://0.0.0.0:${port}`);
});
