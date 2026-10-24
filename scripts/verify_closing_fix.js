const http = require('http');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../public/motion_reference/verified_close_fix');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function getWsUrl() {
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
  console.log('Connected to CDP');

  await send('Page.enable');
  await send('Runtime.enable');

  // Navigate to root
  console.log('Navigating to http://localhost:3000/...');
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise((r) => setTimeout(r, 1500));

  // Unfold Group 2 (Monumental Modernism - Purple)
  console.log('Unfolding Group 2 (Monumental Modernism)...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const covers = Array.from(document.querySelectorAll('div[class*="stackCover"]'));
      const cover2 = covers.find(c => c.textContent.includes('Monumental Modernism'));
      if (cover2) cover2.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 600));

  // Click 3rd folder tab (Paul Rudolph - black tab)
  // Clean outDir before capturing
  fs.readdirSync(outDir).forEach((f) => fs.unlinkSync(path.join(outDir, f)));

  // Click 3rd folder tab (Paul Rudolph - black tab)
  console.log('Clicking 3rd folder tab (Paul Rudolph)...');
  const clickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const tabs = Array.from(document.querySelectorAll('div[class*="tag"]'));
      const paul = tabs.find(t => t.textContent.includes('Paul Rudolph'));
      if (paul) {
        paul.click();
        return 'Clicked Paul Rudolph';
      }
      return 'Paul Rudolph not found';
    })()`,
    returnByValue: true,
  });
  console.log('Tab click:', clickRes.result.value);

  // Capture opening frames at 300ms, 600ms, 900ms to verify top tabs NEVER show during opening
  await new Promise((r) => setTimeout(r, 350));
  const shotOpen1 = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'opening_01_0350ms.png'), Buffer.from(shotOpen1.data, 'base64'));

  await new Promise((r) => setTimeout(r, 450));
  const shotOpen2 = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, 'opening_02_0800ms.png'), Buffer.from(shotOpen2.data, 'base64'));

  // Wait for reader view to fully settle
  await new Promise((r) => setTimeout(r, 1400));

  // Take screenshot and measure width of opened Paul Rudolph dossier
  const dossierMetrics = await send('Runtime.evaluate', {
    expression: `(() => {
      const content = document.querySelector('section[class*="caseContent"]');
      const inner = document.querySelector('div[class*="caseContentInner"]');
      const folder = document.querySelector('div[class*="caseFolder"]');
      const topTabs = document.querySelector('div[class*="stackPage"]');
      return {
        contentWidth: content ? Math.round(content.getBoundingClientRect().width) : null,
        innerWidth: inner ? Math.round(inner.getBoundingClientRect().width) : null,
        folderWidth: folder ? Math.round(folder.getBoundingClientRect().width) : null,
        topTabsOpacity: topTabs ? window.getComputedStyle(topTabs).opacity : null,
        topTabsPointerEvents: topTabs ? window.getComputedStyle(topTabs).pointerEvents : null,
      };
    })()`,
    returnByValue: true,
  });
  console.log('Dossier Metrics:', dossierMetrics.result.value);

  const shotOpen = await send('Page.captureScreenshot');
  fs.writeFileSync(path.join(outDir, '01_opened_dossier.png'), Buffer.from(shotOpen.data, 'base64'));
  console.log('Saved 01_opened_dossier.png');

  // Click close trigger
  console.log('Triggering close...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const logo = document.querySelector('div[class*="theLogo"]');
      if (logo) logo.click();
    })()`,
  });

  // Capture frames continuously across 2.5s to verify smooth motion and sequential reveals
  const telemetry = [];
  const startTime = Date.now();
  const totalDuration = 2500; // ms

  let frameIdx = 0;
  while (Date.now() - startTime <= totalDuration) {
    const actualElapsed = Date.now() - startTime;
    const shot = await send('Page.captureScreenshot');
    const filename = `frame_${String(frameIdx).padStart(2, '0')}_${String(actualElapsed).padStart(4, '0')}ms.png`;
    fs.writeFileSync(path.join(outDir, filename), Buffer.from(shot.data, 'base64'));

    const probe = await send('Runtime.evaluate', {
      expression: `(() => {
        const cf = document.querySelector('div[class*="caseFolder"]');
        const cover = document.querySelector('div[class*="caseFolderCover"]');
        const stack = document.querySelector('div[class*="stack"]');
        const g2 = stack ? stack.children[2] : null;
        const heroTitle = document.querySelector('h1[class*="sectionHeroTitle"]');
        const heroDesc = document.querySelector('p[class*="sectionHeroDesc"]');
        const siblings = stack ? [stack.children[0], stack.children[1], stack.children[3]].filter(Boolean) : [];

        return {
          frameIndex: ${frameIdx},
          timestampMs: ${actualElapsed},
          file: "${filename}",
          caseFolder: cf ? {
            top: Math.round(cf.getBoundingClientRect().top),
            left: Math.round(cf.getBoundingClientRect().left),
            width: Math.round(cf.getBoundingClientRect().width),
            height: Math.round(cf.getBoundingClientRect().height),
            transform: window.getComputedStyle(cf).transform,
            opacity: window.getComputedStyle(cf).opacity
          } : null,
          cover: cover ? {
            transform: window.getComputedStyle(cover).transform
          } : null,
          stackGroup2: g2 ? {
            top: Math.round(g2.getBoundingClientRect().top),
            left: Math.round(g2.getBoundingClientRect().left),
            width: Math.round(g2.getBoundingClientRect().width),
            height: Math.round(g2.getBoundingClientRect().height),
            opacity: window.getComputedStyle(g2).opacity,
            transform: window.getComputedStyle(g2).transform
          } : null,
          heroTitle: heroTitle ? {
            opacity: parseFloat(window.getComputedStyle(heroTitle).opacity),
            transform: window.getComputedStyle(heroTitle).transform
          } : null,
          heroDesc: heroDesc ? {
            opacity: parseFloat(window.getComputedStyle(heroDesc).opacity),
            transform: window.getComputedStyle(heroDesc).transform
          } : null,
          siblingTransforms: siblings.map(s => window.getComputedStyle(s).transform)
        };
      })()`,
      returnByValue: true,
    });

    telemetry.push(probe.result.value);
    console.log(`[${actualElapsed}ms] caseFolder=${probe.result.value.caseFolder ? 'top=' + probe.result.value.caseFolder.top : 'NONE'} | stackG2_op=${probe.result.value.stackGroup2?.opacity} | heroTitle_op=${probe.result.value.heroTitle?.opacity} | heroDesc_op=${probe.result.value.heroDesc?.opacity}`);
    frameIdx++;
  }

  fs.writeFileSync(path.join(outDir, 'telemetry.json'), JSON.stringify(telemetry, null, 2));
  console.log(`Successfully verified! Telemetry & screenshots saved to ${outDir}`);

  ws.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
