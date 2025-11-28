// Livents v16 minimal server - No dependencies
import http from 'http';
import url from 'url';

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
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
      message: 'Livents v16 server is running!',
      status: 'OK',
      version: '16.0.0',
      timestamp: new Date().toISOString()
    }));
  }
  else if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      server: 'Livents v16',
      timestamp: new Date().toISOString()
    }));
  }
  else if (pathname === '/api/status' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      service: 'Livents Streaming',
      version: 'v16',
      endpoints: {
        producer: '/api/producer',
        viewer: '/api/viewer'
      },
      timestamp: new Date().toISOString()
    }));
  }
  else {
    // 404 - Route not found
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Route not found',
      path: pathname
    }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Livents v16 server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
  console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
});
