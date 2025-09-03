const http = require('http');

// A list of ports for our backend servers
const ports = [3001, 3002, 3003];

// Loop through the ports and create a server for each one
ports.forEach(port => {
    // This is the function that handles incoming requests
    const requestHandler = (request, response) => {
        console.log(`Request received on port ${port} for URL: ${request.url}`);

        // Send a 200 OK HTTP status code
        response.writeHead(200);

        // Send a unique response body so we know which server is responding
        response.end(`Hello from backend server on port ${port}!`);
    };

    // Create the server using our handler
    const server = http.createServer(requestHandler);

    // Start listening for connections on the specified port
    server.listen(port, (err) => {
        if (err) {
            return console.log('Something bad happened:', err);
        }
        console.log(` Backend server is listening on http://localhost:${port}`);
    });
});