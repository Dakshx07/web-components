const http = require('http');
const fs = require('fs');
const path = require('path');

if (!fs.existsSync('scratch')) {
  fs.mkdirSync('scratch', { recursive: true });
}

async function getWsDebuggerUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const targets = JSON.parse(data);
        const page = targets.find(t => t.type === 'page' && t.url.includes('3000'));
        if (page && page.webSocketDebuggerUrl) {
          resolve(page.webSocketDebuggerUrl);
        } else {
          reject(new Error('No localhost:3000 page target found'));
        }
      });
    }).on('error', reject);
  });
}

let msgId = 1;
function sendCDP(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  const wsUrl = await getWsDebuggerUrl();
  console.log('Connecting to', wsUrl);
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.addEventListener('open', r));

  console.log('Connected to CDP');
  await sendCDP(ws, 'Page.enable');
  await sendCDP(ws, 'Runtime.enable');

  // Step 1: Navigate to http://localhost:3000/ and wait for load
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 1500));

  // Step 2: Unfold group 2 (Monumental Modernism)
  console.log('Unfolding group 2...');
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const covers = document.querySelectorAll('div[class*="stackCover"]');
      // Group 2 is the 3rd cover (index 2)
      if (covers[2]) covers[2].click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // Step 3: Click Paul Rudolph tab (3rd tab in group 2)
  console.log('Clicking Paul Rudolph tab...');
  const tabClickResult = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const tabs = Array.from(document.querySelectorAll('div[class*="tag"]'));
      const paulRudolph = tabs.find(t => t.textContent.includes('Paul Rudolph'));
      if (paulRudolph) {
        paulRudolph.click();
        return 'Clicked Paul Rudolph';
      }
      return 'Paul Rudolph tab not found: ' + tabs.map(t => t.textContent.trim()).join(', ');
    })()`,
    returnByValue: true
  });
  console.log('Tab click result:', tabClickResult.result.value);

  // Wait 2.2s for reader view to fully open
  await new Promise(r => setTimeout(r, 2200));

  // Screenshot open state
  const openShot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/trace_open_state.png', Buffer.from(openShot.data, 'base64'));
  console.log('Saved scratch/trace_open_state.png');

  // Step 4: Inject telemetry probe to monitor the closing animation frame-by-frame
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      window.__closeTelemetry = [];
      const startTime = performance.now();
      const interval = setInterval(() => {
        const caseFolder = document.querySelector('div[class*="caseFolder"]');
        const stackGroups = document.querySelectorAll('div[class*="stackGroup"]');
        const targetStackGroup = stackGroups[2]; // group 2
        const heroTitle = document.querySelector('h1[class*="sectionHeroTitle"]');

        const entry = {
          t: Math.round(performance.now() - startTime),
          caseFolderExists: !!caseFolder,
          caseFolderRect: caseFolder ? {
            top: caseFolder.getBoundingClientRect().top,
            left: caseFolder.getBoundingClientRect().left,
            width: caseFolder.getBoundingClientRect().width,
            height: caseFolder.getBoundingClientRect().height,
            transform: window.getComputedStyle(caseFolder).transform,
            opacity: window.getComputedStyle(caseFolder).opacity,
          } : null,
          targetStackGroupOpacity: targetStackGroup ? window.getComputedStyle(targetStackGroup).opacity : null,
          targetStackGroupRect: targetStackGroup ? {
            top: targetStackGroup.getBoundingClientRect().top,
            left: targetStackGroup.getBoundingClientRect().left,
            width: targetStackGroup.getBoundingClientRect().width,
            height: targetStackGroup.getBoundingClientRect().height,
            transform: window.getComputedStyle(targetStackGroup).transform,
          } : null,
          heroTitleOpacity: heroTitle ? window.getComputedStyle(heroTitle).opacity : null,
          heroTitleTransform: heroTitle ? window.getComputedStyle(heroTitle).transform : null,
        };
        window.__closeTelemetry.push(entry);
      }, 50);

      window.__stopTelemetry = () => clearInterval(interval);
    })()`
  });

  // Step 5: Click the close button / logo / close trigger
  console.log('Clicking close button...');
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      // Find logo or close trigger
      const logo = document.querySelector('div[class*="theLogo"]');
      if (logo) logo.click();
    })()`
  });

  // Collect samples during closing (total 2.5s)
  // Also take screenshots at t=1.0s, t=1.4s, t=1.5s, t=1.6s, t=2.0s
  await new Promise(r => setTimeout(r, 1000));
  const shot1 = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/trace_close_1000ms.png', Buffer.from(shot1.data, 'base64'));

  await new Promise(r => setTimeout(r, 450));
  const shot145 = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/trace_close_1450ms.png', Buffer.from(shot145.data, 'base64'));

  await new Promise(r => setTimeout(r, 150));
  const shot16 = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/trace_close_1600ms.png', Buffer.from(shot16.data, 'base64'));

  await new Promise(r => setTimeout(r, 900));
  const shotFinal = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/trace_close_final.png', Buffer.from(shotFinal.data, 'base64'));

  // Get telemetry data
  const telemetryRes = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      window.__stopTelemetry();
      return JSON.stringify(window.__closeTelemetry);
    })()`,
    returnByValue: true
  });

  const telemetry = JSON.parse(telemetryRes.result.value);
  fs.writeFileSync('scratch/close_telemetry.json', JSON.stringify(telemetry, null, 2));
  console.log('Captured', telemetry.length, 'telemetry frames');

  // Print critical transition frames around t=1200ms to t=1800ms
  const critical = telemetry.filter(d => d.t >= 1100 && d.t <= 1900);
  console.log('\n--- CRITICAL TRANSITION SAMPLES (t=1100ms .. 1900ms) ---');
  for (const c of critical) {
    console.log(`t=${c.t}ms | caseFolder: ${c.caseFolderExists ? 'EXISTS' : 'NONE'} | caseTop: ${c.caseFolderRect?.top?.toFixed(1) || '-'} | stackTop: ${c.targetStackGroupRect?.top?.toFixed(1) || '-'} | stackOp: ${c.targetStackGroupOpacity} | heroOp: ${c.heroTitleOpacity}`);
  }

  ws.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
