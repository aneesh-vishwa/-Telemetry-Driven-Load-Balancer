const net = require('net');
const { getPools, setServerHealth } = require('./serverPool');

function checkServer(server) {
    const socket = net.connect({
        port: server.url.port,
        host: server.url.hostname,
    }, () => {
        setServerHealth(server.url, true);
        socket.end();
    });

    socket.on('error', (err) => {
        setServerHealth(server.url, false);
    });

    socket.setTimeout(2000, () => {
        socket.destroy();
    });
}

function startHealthChecks() {
    console.log('Health check service started.');
    setInterval(() => {
        const pools = getPools();
        for (const poolName in pools) {
            if (pools[poolName].servers.length > 0) {
                pools[poolName].servers.forEach(checkServer);
            }
        }
    }, 5000);
}

module.exports = { startHealthChecks };