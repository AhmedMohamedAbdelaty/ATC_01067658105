// This file is used to help with debugging Vercel deployments
// You can reference it in your vercel.json for deeper customization

module.exports = (req, res, next) => {
  // Log request info to Vercel logs
  console.log(`[Server Middleware] ${req.method} ${req.url}`);

  // Add CORS headers for API proxy routes
  if (req.url.startsWith('/api/proxy')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }
  }

  // Continue with normal processing
  next();
}
