/**
 * Phase 2E: HTTP & Asset Endpoint Tests against live production build
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as http from 'http';

async function isServerRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', () => resolve(true));
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function fetchEndpoint(urlOrPath: string): Promise<{ status: number; contentType?: string; body: string }> {
  const url = urlOrPath.startsWith('http') ? urlOrPath : `http://localhost:3000${urlOrPath}`;
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchEndpoint(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () =>
        resolve({
          status: res.statusCode || 0,
          contentType: res.headers['content-type'],
          body: data,
        })
      );
    }).on('error', (err) => reject(err));
  });
}

describe('Phase 2E: HTTP Asset & Route Verification', () => {
  let serverAvailable = false;

  beforeAll(async () => {
    serverAvailable = await isServerRunning();
  });

  it('serves root page with status 200 and manifest link', async ({ skip }) => {
    if (!serverAvailable) return skip();
    const res = await fetchEndpoint('/');
    expect(res.status).toBe(200);
    expect(res.body).toContain('manifest.webmanifest');
  }, 30000);

  it('serves dashboard route with status 200', async ({ skip }) => {
    if (!serverAvailable) return skip();
    const res = await fetchEndpoint('/dashboard');
    expect(res.status).toBe(200);
  }, 30000);

  it('serves manifest.webmanifest with status 200 and correct JSON structure', async ({ skip }) => {
    if (!serverAvailable) return skip();
    const res = await fetchEndpoint('/manifest.webmanifest');
    expect(res.status).toBe(200);
    const manifest = JSON.parse(res.body);
    expect(manifest.name).toBe('replyf');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBe(3);
  });

  it('serves sw.js with status 200', async ({ skip }) => {
    if (!serverAvailable) return skip();
    const res = await fetchEndpoint('/sw.js');
    expect(res.status).toBe(200);
    expect(res.body).toContain('workout-planner-shell-v1');
    expect(res.body).toContain('CURRENT_CACHES');
  });

  it('serves offline.html fallback page with status 200', async ({ skip }) => {
    if (!serverAvailable) return skip();
    const res = await fetchEndpoint('/offline.html');
    expect(res.status).toBe(200);
    expect(res.body).toContain("You're Offline");
    expect(res.body).toContain('Your workouts are saved on this device');
  });

  it('serves 192x192 icon with status 200', async ({ skip }) => {
    if (!serverAvailable) return skip();
    const res = await fetchEndpoint('/icons/icon-192x192.png');
    expect(res.status).toBe(200);
  });

  it('serves 512x512 icon with status 200', async ({ skip }) => {
    if (!serverAvailable) return skip();
    const res = await fetchEndpoint('/icons/icon-512x512.png');
    expect(res.status).toBe(200);
  });

  it('serves maskable icon with status 200', async ({ skip }) => {
    if (!serverAvailable) return skip();
    const res = await fetchEndpoint('/icons/icon-maskable-512x512.png');
    expect(res.status).toBe(200);
  });
});
