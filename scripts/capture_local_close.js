const fs = require('fs');
const path = require('path');

const wsUrl = 'ws://localhost:9222/devtools/page/0913C115D2AD99F5D25B540801F42F3C';
const outDir = path.join(__dirname, '../public/motion_reference/local_close');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
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

  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  console.log('Connected to Local CDP for close sequence');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });

  // Navigate to local home stack and wait
  console.log('Navigating to http://localhost:3000/...');
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 2000));

  // Open Mary Colter
  console.log('Opening Mary Colter folder on local...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const marySpan = spans.find(s => s.innerText === 'Mary Colter');
      if (marySpan) {
        const tab = marySpan.closest('[class*="stackPageHeader"] > div');
        if (tab) tab.click();
      }
    })()`
  });

  // Wait 2500ms for opening animation to fully complete and settle into case-view
  console.log('Waiting 2500ms for Mary Colter to fully settle into case-view...');
  await new Promise(r => setTimeout(r, 2500));

  // Scroll to top
  await send('Runtime.evaluate', {
    expression: `(() => { window.scrollTo(0, 0); })()`
  });
  await new Promise(r => setTimeout(r, 300));

  console.log('Clicking header logo to trigger close...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const logo = document.querySelector('[class*="theLogo"]');
      if (logo) logo.click();
    })()`
  });

  const startTime = Date.now();
  const telemetry = [];
  const totalDuration = 2200; // ms
  const interval = 50; // ms

  let frameIdx = 0;
  for (let targetT = 0; targetT <= totalDuration; targetT += interval) {
    const elapsed = Date.now() - startTime;
    const wait = Math.max(0, targetT - elapsed);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));

    const shot = await send('Page.captureScreenshot');
    const filename = `frame_${String(frameIdx).padStart(3, '0')}_${String(targetT).padStart(4, '0')}ms.png`;
    fs.writeFileSync(path.join(outDir, filename), Buffer.from(shot.data, 'base64'));

    const probe = await send('Runtime.evaluate', {
      expression: `(() => {
        const cf = document.querySelector('[class*="caseFolder"]');
        const cover = document.querySelector('[class*="caseFolderCover"]');
        const stackGroups = Array.from(document.querySelectorAll('[class*="stackGroup"]'));
        const activeGroup = stackGroups[3];
        const heroTitle = document.querySelector('[class*="caseHeroTitle"]') || document.querySelector('[class*="sectionHeroTitle"]');

        return {
          frameIndex: ${frameIdx},
          timestampMs: ${targetT},
          file: "${filename}",
          caseFolder: cf ? {
            rect: {
              top: Math.round(cf.getBoundingClientRect().top),
              left: Math.round(cf.getBoundingClientRect().left),
              width: Math.round(cf.getBoundingClientRect().width),
              height: Math.round(cf.getBoundingClientRect().height),
            },
            transform: window.getComputedStyle(cf).transform,
            opacity: window.getComputedStyle(cf).opacity
          } : null,
          cover: cover ? {
            transform: window.getComputedStyle(cover).transform
          } : null,
          activeGroupInStack: activeGroup ? {
            rect: {
              top: Math.round(activeGroup.getBoundingClientRect().top),
              left: Math.round(activeGroup.getBoundingClientRect().left),
              width: Math.round(activeGroup.getBoundingClientRect().width),
              height: Math.round(activeGroup.getBoundingClientRect().height),
            },
            opacity: window.getComputedStyle(activeGroup).opacity
          } : null,
          heroTitle: heroTitle ? {
            opacity: window.getComputedStyle(heroTitle).opacity,
            transform: window.getComputedStyle(heroTitle).transform
          } : null
        };
      })()`,
      returnByValue: true
    });

    telemetry.push(probe.result.value);
    console.log(`[local_close ${targetT}ms] Saved ${filename}`);
    frameIdx++;
  }

  fs.writeFileSync(path.join(outDir, 'telemetry.json'), JSON.stringify(telemetry, null, 2));
  const manifest = telemetry.map(t => ({
    frameIndex: t.frameIndex,
    timestampMs: t.timestampMs,
    file: t.file,
    url: `/motion_reference/local_close/${t.file}`
  }));
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`Successfully extracted ${frameIdx} frames to ${outDir}`);
  ws.close();
}

run().catch(err => {
  console.error('Local close extraction error:', err);
  process.exit(1);
});
