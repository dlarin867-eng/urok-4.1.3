import { createRequire } from 'node:module';
import path from 'node:path';
import type { IncomingMessage } from 'node:http';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Dev only: serves netlify/functions/<name>.js at /.netlify/functions/<name>,
// so `npm run dev` works without netlify-cli. Production still deploys to Netlify.
function netlifyFunctionsDev(): Plugin {
  const require = createRequire(import.meta.url);
  const functionsDir = path.resolve('netlify/functions');

  const readBody = async (req: IncomingMessage) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks).toString('utf8');
  };

  return {
    name: 'netlify-functions-dev',
    configureServer(server) {
      server.middlewares.use('/.netlify/functions', async (req, res) => {
        const name = (req.url || '/').split('?')[0].replace(/^\//, '');
        const file = path.join(functionsDir, `${name}.js`);
        if (!/^[\w-]+$/.test(name)) {
          res.statusCode = 404;
          res.end('Function not found');
          return;
        }
        try {
          const { handler } = require(file);
          const result = await handler({
            httpMethod: req.method,
            headers: req.headers,
            body: await readBody(req),
            path: req.originalUrl,
          });
          res.statusCode = result.statusCode || 200;
          for (const [key, value] of Object.entries(result.headers || {})) res.setHeader(key, String(value));
          res.end(result.body ?? '');
        } catch (err) {
          const notFound = (err as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND' && String(err).includes(file);
          res.statusCode = notFound ? 404 : 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: notFound ? 'Function not found' : String((err as Error).message) }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Server-side keys from .env for the dev functions; real environment variables win.
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ''))) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return {
    plugins: [react(), netlifyFunctionsDev()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
