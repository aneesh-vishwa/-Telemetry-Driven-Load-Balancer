const fs = require('fs');
const startBalancer = require('./src/balancer');
const { startHealthChecks } = require('./src/healthCheck');
const { startApiServer } = require('./src/api');
const serverPool = require('./src/serverPool');

// --- Step 1: Load Configuration ---
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const tlsOptions = {
    key: fs.readFileSync(config.tlsOptions.key),
    cert: fs.readFileSync(config.tlsOptions.cert)
};

// --- Step 2: Initialize Core State FIRST ---
serverPool.initializePools(config);
console.log('Server pools initialized.');

// --- Step 3: Start All Services ---
const server = startBalancer(config, tlsOptions);
startHealthChecks();
startApiServer(config.apiPort);

// Graceful shutdown logic
process.on('SIGINT', () => {
    console.log('\nSIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('All connections closed. Exiting.');
        process.exit(0);
    });
    // Optional: add a timeout to force exit if connections hang
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
});