const tls = require('tls');
const net = require('net');
const crypto = require('crypto');
const serverPool = require('./serverPool');
const fs = require('fs');
const path = require('path');

// Load config and TLS options
const config = require('../config.json');
const tlsOptions = {
     key: fs.readFileSync(config.tlsOptions.key),
        cert: fs.readFileSync(config.tlsOptions.cert)
};

const sessions = {}; // In-memory store for sticky sessions: sessionId -> serverId

function getSessionId(requestData) {
    const headers = requestData.toString().split('\r\n');
    const cookieHeader = headers.find(h => h.startsWith('Cookie:'));
    if (cookieHeader) {
        const match = cookieHeader.match(/session=([^\s;]+)/);
        return match ? match[1] : null;
    }
    return null;
}

function getPoolForRequest(requestData, config) {
    const firstLine = requestData.toString().split('\r\n')[0];
    const path = firstLine.split(' ')[1] || '/';
    const rule = config.routingRules.find(r => path.startsWith(r.path));
    return rule ? rule.pool : config.defaultPool;
}

function startBalancer(config, tlsOptions) {
    const server = tls.createServer(tlsOptions, clientSocket => {
        clientSocket.once('data', (initialData) => {
            let backendServer;
            let isNewSession = false;
            const sessionId = getSessionId(initialData);

            // --- REVISED AND FOOLPROOF LOGIC ---

            // 1. Always determine the correct pool for this request first.
            const poolName = getPoolForRequest(initialData, config);

            // 2. Try to find a server using the sticky session ID.
            if (sessionId && sessions[sessionId]) {
                backendServer = serverPool.getServerById(sessions[sessionId]);
            }

            // 3. If no sticky server was found (or it was unhealthy), use the load balancer.
            if (!backendServer) {
                backendServer = serverPool.getNextServer(poolName);
                isNewSession = true; // Mark as a new session if we're using the load balancer.
            }

            // 4. Final, single point of failure. If no server could be found, the service is down.
            if (!backendServer) {
                console.error(`[CRITICAL] No healthy backend servers available for pool: ${poolName}`);
                clientSocket.end('HTTP/1.1 503 Service Unavailable\r\n\r\n');
                return;
            }

            // 5. THE CRITICAL FIX: Now that we have a definitive server, count the request for BOTH the pool and the individual server.
            serverPool.incrementRequestCount(poolName);
            serverPool.incrementServerRequestCount(backendServer.id);


            // --- PROCEED WITH CONNECTION ---
            const backendSocket = net.connect({
                port: backendServer.url.port,
                host: backendServer.url.hostname,
            });

            serverPool.incrementConnections(backendServer.url);

            let newSessionId = sessionId;
            if (isNewSession) {
                newSessionId = crypto.randomBytes(16).toString('hex');
                sessions[newSessionId] = backendServer.id;
            }

            let firstChunk = true;
            if (isNewSession) {
                backendSocket.on('data', responseData => {
                    if (firstChunk) {
                        let responseStr = responseData.toString();
                        const cookieHeader = `Set-Cookie: session=${newSessionId}; HttpOnly; Path=/`;
                        responseStr = responseStr.replace(/(\r\n\r\n)/, `\r\n${cookieHeader}\r\n\r\n`);
                        clientSocket.write(responseStr);
                        firstChunk = false;
                    } else {
                        clientSocket.write(responseData);
                    }
                });
            } else {
                backendSocket.pipe(clientSocket);
            }

            backendSocket.write(initialData);
            clientSocket.pipe(backendSocket);

            const onSocketEnd = () => {
                serverPool.decrementConnections(backendServer.url);
            };

            clientSocket.on('close', onSocketEnd);
            backendSocket.on('close', onSocketEnd);
            clientSocket.on('error', (err) => { console.error('Client socket error:', err.message); });
            backendSocket.on('error', (err) => {
                console.error(`Error connecting to backend ${backendServer.url.href}:`, err.message);
                serverPool.setServerHealth(backendServer.url, false);
                clientSocket.end('HTTP/1.1 500 Internal Server Error\r\n\r\n');
            });
        });
    });

    server.listen(config.port, () => {
        console.log(`L7 Secure Load Balancer (Least Connections) listening on port ${config.port}`);
    });

    return server;
}

module.exports = startBalancer;

