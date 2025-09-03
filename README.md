 Project: L7 Load Balancer with Dynamic Control Plane
This project is a fully functional, secure, Layer 7 Load Balancer built from scratch in Node.js. It is designed to act as an intelligent and resilient traffic manager for a backend web service, mirroring the architecture used in modern, large-scale cloud applications.

The system features a decoupled Control Plane (a management API and web dashboards) that can reconfigure the Data Plane (the core load balancer) in real-time with zero downtime, demonstrating advanced concepts in system design and operational excellence.

🚀 Core Features
This is not just a simple TCP proxy. The system implements a suite of advanced features essential for a production-grade infrastructure service:

L7 Path-Based Routing: Intelligently routes traffic based on the application-level request path (e.g., /api/* traffic is sent to dedicated API servers).

Dynamic Control Plane: A robust Express.js API and two web dashboards allow for live management and monitoring of the system.

Management Dashboard: Add or remove backend servers from pools with zero downtime.

Live Traffic Monitor: A real-time charting dashboard to visualize request distribution across every individual server.

Active Health Monitoring: A background service constantly checks the health of all backend servers, automatically removing unhealthy or crashed servers from the rotation to ensure fault tolerance.

Security with HTTPS Termination: The load balancer acts as the secure entry point, handling TLS handshakes and decrypting traffic before forwarding it to the internal backend services (SSL Offloading).

Intelligent Load Balancing: Implements a "Least Connections" algorithm to distribute traffic to the server that is currently handling the fewest active connections.

Sticky Sessions: Uses cookies to ensure that once a user is assigned to a server, they "stick" to that same server for subsequent requests, maintaining application state.

Real-time Observability: Exposes detailed metrics for both server pools and individual servers, providing a live, quantifiable view of the system's performance.

Dashboards
The project includes two interactive web dashboards served by the control plane API.

1. Management Control Panel
Live view of server pools, their health status, and a form to dynamically add or remove servers.

2. Live Traffic Monitor
A real-time bar chart that visualizes the number of requests handled by each individual server. The bar color changes based on the server's health status.

Getting Started
Follow these instructions to get the entire system running on your local machine.

Prerequisites
Node.js: Version 18.x or later.

npm: Comes bundled with Node.js.

OpenSSL: For generating the required SSL/TLS certificate.

Windows: Included with Git for Windows.

macOS / Linux: Pre-installed on most systems.

1. Installation
Clone the repository and install the project's dependencies.

git clone https://github.com/aneesh-vishwa/-Telemetry-Driven-Load-Balancer.git
cd load-balancer
npm install

2. Generate SSL Certificate
The load balancer requires a private key and a public certificate to handle HTTPS traffic. You need to generate these once.

For Linux & macOS users:
Run the following command in your terminal. You can press Enter to accept the default values for all prompts.

openssl req -x509 -newkey rsa:2048 -nodes -sha256 -keyout server.key -out server.crt -days 365

For Windows users (in PowerShell or Git Bash):
To avoid potential configuration issues with OpenSSL on Windows, use this more direct command. It provides all the necessary information at once.

openssl req -x509 -newkey rsa:2048 -nodes -sha256 -keyout server.key -out server.crt -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

After running the command, you will have two new files in your project root: server.key and server.crt.

3. Running the System
To see the full demonstration, you will need three separate terminal windows running in the load-balancer directory.

▶️ Terminal 1: Start the Backend Servers
This command starts the realistic e-commerce application servers that your load balancer will manage.

node ecommerce-backend.js

You will see confirmation that servers are running on ports 3001, 3002, and 3003. Leave this terminal running.

▶️ Terminal 2: Start the Load Balancer
This command starts the main application: the TLS load balancer and the control plane API.

node index.js

You will see confirmation that the services are listening on ports 8443 and 9000, followed by logs from the health checker. Leave this terminal running.

▶️ Terminal 3: Start the Live Traffic Simulator
This command starts the script that simulates 8 concurrent users continuously sending requests to your application.

node live-simulator.js

You will see a continuous stream of logs showing user actions. Leave this running to generate traffic for your dashboards.

4. Accessing the Dashboards
With all three services running, open your web browser:

Management Dashboard: Navigate to http://localhost:9000

Live Traffic Monitor: From the main dashboard, click the "View Live Traffic Monitor" link, or navigate directly to http://localhost:9000/traffic

You can now use the dashboards to manage the servers and watch the real-time impact on the traffic charts!