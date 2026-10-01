import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import inspectHandler from './api/inspect.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-server-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/inspect' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                req.body = body ? JSON.parse(body) : {};
                const jsonRes = {
                  status(code) {
                    res.statusCode = code;
                    return jsonRes;
                  },
                  setHeader(k, v) {
                    res.setHeader(k, v);
                    return jsonRes;
                  },
                  json(data) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  }
                };
                await inspectHandler(req, jsonRes);
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'SERVER_ERROR', message: err.message }));
              }
            });
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 3000,
    open: false,
    host: true
  }
});

