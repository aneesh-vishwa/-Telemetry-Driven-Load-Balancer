const express = require('express');
const path = require('path');
const serverPool = require('./serverPool');

function startApiServer(port) {
    const app = express();
    app.use(express.json());

    const staticPath = path.join(__dirname, '..');
    app.use(express.static(staticPath));

    app.get('/', (req, res) => {
        res.sendFile(path.join(staticPath, 'dashboard.html'));
    });

    app.get('/traffic', (req, res) => {
        res.sendFile(path.join(staticPath, 'traffic-dashboard.html'));
    });

    app.get('/metrics', (req, res) => {
        res.json(serverPool.getMetrics());
    });

    app.get('/servers/metrics', (req, res) => {
        res.json(serverPool.getServerMetrics());
    });

    app.get('/pools', (req, res) => {
        res.json(serverPool.getPools());
    });

    app.post('/pools/:poolName/servers', (req, res) => {
        const { poolName } = req.params;
        const { serverUrl } = req.body;
        if (!serverUrl || typeof serverUrl !== 'string' || serverUrl.trim() === '') {
            return res.status(400).send('Invalid or missing serverUrl in request body');
        }
        try {
            const url = new URL(serverUrl);
            if (!url.hostname) { throw new Error('Hostname cannot be empty.'); }
        } catch (error) {
            return res.status(400).send(`Invalid URL format: ${error.message}`);
        }
        const success = serverPool.addServer(poolName, serverUrl);
        if (success) {
            res.status(201).send(`Server ${serverUrl} added to pool ${poolName}`);
        } else {
            res.status(404).send(`Pool not found or server already exists.`);
        }
    });

    app.delete('/pools/:poolName/servers/:serverId', (req, res) => {
        const { poolName, serverId } = req.params;
        const decodedServerId = Buffer.from(serverId, 'base64').toString('ascii');
        const success = serverPool.removeServer(poolName, decodedServerId);
        if (success) {
            res.status(200).send(`Server ${decodedServerId} removed from pool ${poolName}`);
        } else {
            res.status(404).send(`Pool ${poolName} or server ${decodedServerId} not found.`);
        }
    });

    app.listen(port, () => {
        console.log(`✅ Control Plane API & Dashboard running on http://localhost:${port}`);
    });
}

module.exports = { startApiServer };