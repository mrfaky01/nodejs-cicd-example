const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello from Jenkins CI/CD! This is the nodejs-cicd-example app.');
});

app.listen(port, () => {
  console.log(`Node.js CI/CD Example App listening at http://localhost:${port}`);
});