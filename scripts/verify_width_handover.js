const http = require('http');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../public/motion_reference/verified_width_fix');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        const pages = JSON.parse(data);
        const page = pages.find((p) => p.type === 'page' && p.url.includes('3000'));
        if (page) resolve(page.webSocketDebuggerUrl);
        else reject(new Error('No page target found on port 9222'));
      });
    }).on('error', reject);
  });
}

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalExpr(ws, expr) {
  const res = await sendCommand(ws, 'Runtime.evaluate', {
    expression: expr,
    returnByValue: true
  });
  return res.result?.value ?? res.value;
}

async function captureScreenshot(ws, filename) {
  const res = await sendCommand(ws, 'Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(res.data, 'base64');
  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, buffer);
  console.log(`Saved screenshot: ${filename}`);
}

async function main() {
  const wsUrl = await getWsUrl();
  console.log('Connecting to Chrome CDP at:', wsUrl);
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));

  console.log('Navigating to http://localhost:3000/...');
  await sendCommand(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Unfold Group 2 (Monumental Modernism - Purple)
  console.log('Unfolding Group 2 (Monumental Modernism)...');
  await evalExpr(ws, `(() => {
    const covers = Array.from(document.querySelectorAll('div[class*="stackCover"]'));
    const cover2 = covers.find(c => c.textContent.includes('Monumental Modernism'));
    if (cover2) cover2.click();
  })()`);
  await new Promise((r) => setTimeout(r, 600));

  // 2. Click 3rd folder tab (Paul Rudolph)
  console.log('Clicking Paul Rudolph tab...');
  const clickRes = await evalExpr(ws, `(() => {
    const tabs = Array.from(document.querySelectorAll('div[class*="tag"]'));
    const paul = tabs.find(t => t.textContent.includes('Paul Rudolph'));
    if (paul) {
      paul.click();
      return 'Clicked Paul Rudolph';
    }
    return 'Paul Rudolph not found';
  })()`);
  console.log('Tab click result:', clickRes);
  await new Promise((r) => setTimeout(r, 1800));

  // Record metrics of opened dossier
  const readerMetrics = await evalExpr(ws, `(() => {
    const folder = document.querySelector('div[class*="caseFolder"]');
    const inner = document.querySelector('div[class*="caseContentInner"]');
    const r = folder ? folder.getBoundingClientRect() : null;
    return {
      folderWidth: r ? Math.round(r.width) : null,
      folderLeft: r ? Math.round(r.left) : null,
      folderRight: r ? Math.round(r.right) : null,
      innerExpectedWidth: inner ? Math.round(inner.getBoundingClientRect().width) : null
    };
  })()`);
  console.log('Opened Dossier Metrics:', readerMetrics);
  await captureScreenshot(ws, '01_dossier_opened.png');

  // Clean previous frames in outDir
  fs.readdirSync(outDir).forEach((f) => {
    if (f.startsWith('frame_')) fs.unlinkSync(path.join(outDir, f));
  });

  // 3. Click Close Button (Logo)
  console.log('Triggering close...');
  await evalExpr(ws, `(() => {
    const logo = document.querySelector('div[class*="theLogo"]');
    if (logo) logo.click();
  })()`);

  // Target time checkpoints to measure width expansion and right edge alignment
  const checkpoints = [
    { label: 'frame_00_0080ms_start', delay: 80 },
    { label: 'frame_01_0300ms_tilting', delay: 220 },
    { label: 'frame_02_0600ms_in_air', delay: 300 },
    { label: 'frame_03_0950ms_descending', delay: 350 },
    { label: 'frame_04_1200ms_approaching_slot', delay: 250 },
    { label: 'frame_05_1340ms_touchdown', delay: 140 },
    { label: 'frame_06_1450ms_handover_stack', delay: 110 },
    { label: 'frame_07_1650ms_hero_rising', delay: 200 },
    { label: 'frame_08_1900ms_siblings_restored', delay: 250 },
  ];

  for (const cp of checkpoints) {
    await new Promise((r) => setTimeout(r, cp.delay));
    const telemetry = await evalExpr(ws, `(() => {
      const caseFolder = document.querySelector('div[class*="caseFolder"]');
      const stackGroups = document.querySelectorAll('div[class*="stackGroup"]');
      const targetGroup = stackGroups[2]; // Group 2 (Monumental Modernism)

      const cfRect = caseFolder ? caseFolder.getBoundingClientRect() : null;
      const tgRect = targetGroup ? targetGroup.getBoundingClientRect() : null;

      // Measure category text on the active folder
      const activeFolder = caseFolder || targetGroup;
      const catEl = activeFolder ? activeFolder.querySelector('[class*="stackCoverCategory"]') : null;
      const catRect = catEl ? catEl.getBoundingClientRect() : null;

      return {
        activeElement: caseFolder ? 'caseFolder (ReaderView closing)' : 'stackGroup (Stack landed)',
        width: Math.round(cfRect ? cfRect.width : (tgRect ? tgRect.width : 0)),
        left: Math.round(cfRect ? cfRect.left : (tgRect ? tgRect.left : 0)),
        right: Math.round(cfRect ? cfRect.right : (tgRect ? tgRect.right : 0)),
        categoryTextRight: catRect ? Math.round(catRect.right) : null,
      };
    })()`);

    console.log(`[${cp.label}] Telemetry:`, JSON.stringify(telemetry));
    await captureScreenshot(ws, `${cp.label}.png`);
  }

  console.log('Verification burst trace complete!');
  ws.close();
}

main().catch(console.error);
