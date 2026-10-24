const fs = require('fs');
const path = require('path');
const http = require('http');

const outDir = path.join(__dirname, '../public/motion_reference/verified_two_panel');

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        const pages = JSON.parse(data);
        const page = pages.find((p) => p.type === 'page');
        if (page) resolve(page.webSocketDebuggerUrl);
        else reject(new Error('No page target found on port 9222'));
      });
    }).on('error', reject);
  });
}

async function run() {
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === msgId) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await new Promise((r) => ws.addEventListener('open', r, { once: true }));

  // Tablet test: 768 x 1024
  console.log('Testing Tablet Viewport (768x1024)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise((r) => setTimeout(r, 1500));

  let shot = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, '08_tablet_home_stack.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved 08_tablet_home_stack.png');

  // Mobile test: 375 x 812
  console.log('Testing Mobile Viewport (375x812)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 3,
    mobile: true,
  });
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise((r) => setTimeout(r, 1500));

  shot = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, '09_mobile_home_stack.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved 09_mobile_home_stack.png');

  // Restore desktop metrics
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });

  console.log('Responsive verification finished successfully!');
  ws.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
