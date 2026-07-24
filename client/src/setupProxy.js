const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = String(
    process.env.REACT_APP_API_URL || `http://127.0.0.1:${process.env.BACKEND_PORT || 3001}`
  ).replace(/\/api\/?$/, '');
  app.use('/api', createProxyMiddleware({ target, changeOrigin: true }));
};
