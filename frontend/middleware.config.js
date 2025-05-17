// This file is used to configure the middleware behavior for Vercel deployment
module.exports = {
  // Skip middleware for API routes
  skipMiddlewareUrlNormalize: true,
  // Skip middleware for specific routes
  skipTrailingSlashRedirect: true,
  // Add any other middleware configuration options here
};
