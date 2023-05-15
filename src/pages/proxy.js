const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(
    '/',
    createProxyMiddleware({
      target: 'https://api.spotify.com/v1/tracks',
      changeOrigin: true,
      pathRewrite: (path, req) => {
        const id = req.params.id;
        return `/${id}`;
      },
    })
  );

app.listen(3001, () => {
  console.log('Proxy server listening on http://localhost:3001');
});
