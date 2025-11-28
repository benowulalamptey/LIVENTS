// Livents - Low latency streaming server with Livekit
import http from 'http';
import url from 'url';

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Set JSON content type for all responses
  res.setHeader('Content-Type', 'application/json');
  
  // Route handling
  if (pathname === '/' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Livents low-latency streaming server is running!',
      service: 'low-latency',
      features: ['Livekit', 'Mux'],
      status: 'OK',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }));
  }
  else if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      server: 'Livents Low-Latency',
      timestamp: new Date().toISOString()
    }));
  }
  else if (pathname === '/api/status' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      service: 'Livents Low-Latency Streaming',
      version: '1.0.0',
      latency: 'low',
      providers: ['Livekit', 'Mux'],
      endpoints: {
        producer: '/api/producer',
        viewer: '/api/viewer',
        livekit: '/api/livekit/token'
      },
      timestamp: new Date().toISOString()
    }));
  }
  else if (pathname === '/api/livekit/status' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      livekit: 'configured',
      status: 'ready for low-latency streams',
      note: 'Add Livekit SDK and token generation logic here'
    }));
  }
  else {
    // 404 - Route not found
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Route not found',
      path: pathname,
      service: 'Livents Low-Latency'
    }));
  }
});

// Start the server and keep it alive
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Livents low-latency server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
  console.log(`⚡ Livekit: http://localhost:${PORT}/api/livekit/status`);
  console.log('Server is actively listening for low-latency streaming requests...');
});

// Keep the process alive - IMPORTANT FOR RENDER
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  server.close(() => {
    console.log('Livents server closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  server.close(() => {
    console.log('Livents server closed.');
    process.exit(0);
  });
});

// Heartbeat to show it's still alive
setInterval(() => {
  console.log('💚 Livents server heartbeat - running at:', new Date().toISOString());
}, 60000);
