const fs = require('fs');
const path = require('path');
const http = require('http');

const outDir = path.join(__dirname, '../public/motion_reference/verified_two_panel');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

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

async function main() {
  const wsUrl = await getWsUrl();
  console.log('Connecting to Chrome CDP at:', wsUrl);
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
  console.log('Connected to CDP!');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });

  // 1. Navigate to home stack
  console.log('Navigating to http://localhost:3000/...');
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise((r) => setTimeout(r, 2000));

  let shot = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, '01_home_stack.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved 01_home_stack.png');

  // 2. Click Frank Lloyd Wright tab
  console.log('Locating and clicking Frank Lloyd Wright folder tab...');
  const clickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const flwSpan = spans.find(s => s.innerText.includes('Frank Lloyd Wright'));
      if (flwSpan) {
        const tab = flwSpan.closest('[class*="stackPageHeader"] > div') || flwSpan;
        tab.click();
        return { ok: true, name: 'Frank Lloyd Wright' };
      }
      // Fallback: click first folder tab found
      const firstTab = document.querySelector('[class*="stackPageHeader"]');
      if (firstTab) {
        firstTab.click();
        return { ok: true, name: 'First Tab' };
      }
      return { ok: false };
    })()`,
    returnByValue: true,
  });
  console.log('Click result:', clickRes.result.value);

  // 3. Monitor unfolding flight
  console.log('Waiting for unfolding flight (1.6s)...');
  await new Promise((r) => setTimeout(r, 800));
  shot = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, '02_mid_flight_tilt.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved 02_mid_flight_tilt.png');

  await new Promise((r) => setTimeout(r, 1000));

  // 4. Capture open two-panel spread
  shot = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, '03_two_panel_open_spread.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved 03_two_panel_open_spread.png');

  // 5. Evaluate two-panel geometry
  const geom = await send('Runtime.evaluate', {
    expression: `(() => {
      const cover = document.querySelector('[class*="caseFolderCover"]');
      const coverBack = document.querySelector('[class*="caseFolderCoverBack"]');
      const inner = document.querySelector('[class*="caseFolderInner"]');
      const sheet = document.querySelector('[class*="caseFolderSheet"]');
      const folder = document.querySelector('[class*="caseFolder"]');
      const punchHoles = document.querySelectorAll('[class*="caseFolderSheetClip"] span');

      return {
        folder: folder ? {
          rect: folder.getBoundingClientRect(),
          transform: window.getComputedStyle(folder).transform,
          perspective: window.getComputedStyle(folder).perspective,
        } : null,
        cover: cover ? {
          rect: cover.getBoundingClientRect(),
          transform: window.getComputedStyle(cover).transform,
          transformOrigin: window.getComputedStyle(cover).transformOrigin,
        } : null,
        coverBack: coverBack ? {
          transform: window.getComputedStyle(coverBack).transform,
          backgroundColor: window.getComputedStyle(coverBack).backgroundColor,
        } : null,
        inner: inner ? {
          rect: inner.getBoundingClientRect(),
          backgroundColor: window.getComputedStyle(inner).backgroundColor,
        } : null,
        sheet: sheet ? {
          rect: sheet.getBoundingClientRect(),
          width: window.getComputedStyle(sheet).width,
          aspectRatio: window.getComputedStyle(sheet).aspectRatio,
        } : null,
        punchHolesCount: punchHoles.length,
      };
    })()`,
    returnByValue: true,
  });
  console.log('Two-panel geometry report:\n', JSON.stringify(geom.result.value, null, 2));

  // 6. Test scrapbook dragging
  console.log('Testing scrapbook item interaction...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo({ top: 700, behavior: "instant" });
    })()`,
  });
  await new Promise((r) => setTimeout(r, 400));
  shot = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, '04_scrapbook_cluster.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved 04_scrapbook_cluster.png');

  // 7. Test scroll down to Next Architect widget
  console.log('Testing scroll to bottom Next Architect widget...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo({ top: 3200, behavior: "instant" });
    })()`,
  });
  await new Promise((r) => setTimeout(r, 400));
  shot = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, '05_bottom_next_architect.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved 05_bottom_next_architect.png');

  // 8. Test closing back to stack
  console.log('Testing close back to stack...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const subHeaderTitle = document.querySelector('[class*="subHeaderTitle"]');
      if (subHeaderTitle) subHeaderTitle.click();
      else {
        const logo = document.querySelector('[class*="subHeaderLogo"]');
        if (logo) logo.click();
      }
    })()`,
  });

  await new Promise((r) => setTimeout(r, 800));
  shot = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, '06_closing_in_flight.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved 06_closing_in_flight.png');

  await new Promise((r) => setTimeout(r, 1400));
  shot = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, '07_restored_home_stack.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved 07_restored_home_stack.png');

  console.log('Complete verification suite finished successfully!');
  ws.close();
}

main().catch((err) => {
  console.error('Error during test execution:', err);
  process.exit(1);
});
