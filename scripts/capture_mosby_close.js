const fs = require('fs');
const path = require('path');

const wsUrl = 'ws://localhost:9222/devtools/page/44B2500DA310D64CAE61A7D7AC21D241';
const outDir = path.join(__dirname, '../public/motion_reference/mosby_close');

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
  console.log('Connected to Mosby CDP');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });

  // Navigate to case page and wait until fully open
  console.log('Navigating to Mary Colter case...');
  await send('Page.navigate', { url: 'https://www.mosbyfiles.com/cases/mary-colter' });
  await new Promise(r => setTimeout(r, 3000));

  console.log('Ensuring scroll is at top...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo(0, 0);
      if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  console.log('Clicking logo link to trigger folder-close...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const a = document.querySelector('.the-header__logo a') || document.querySelector('header a');
      if (a) a.click();
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
        const cf = document.querySelector('.case-folder');
        const cover = document.querySelector('.case-folder__cover');
        const stackGroups = Array.from(document.querySelectorAll('.stack-group'));
        const activeGroup = stackGroups[3];
        const heroTitle = document.querySelector('.section-hero__title');
        const heroDesc = document.querySelector('.section-hero__desc');

        return {
          frameIndex: ${frameIdx},
          timestampMs: ${targetT},
          file: "${filename}",
          caseFolder: cf ? {
            rect: {
              top: Math.round(cf.getBoundingClientRect().top),
              left: Math.round(cf.getBoundingClientRect().left),
              width: Math.round(cf.getBoundingClientRect().width),
              height: Math.round(cf.getBoundingClientRect().height)
            },
            transform: cf.style.transform || window.getComputedStyle(cf).transform,
            opacity: window.getComputedStyle(cf).opacity
          } : null,
          cover: cover ? {
            transform: cover.style.transform || window.getComputedStyle(cover).transform
          } : null,
          activeGroupInStack: activeGroup ? {
            rect: {
              top: Math.round(activeGroup.getBoundingClientRect().top),
              left: Math.round(activeGroup.getBoundingClientRect().left),
              width: Math.round(activeGroup.getBoundingClientRect().width),
              height: Math.round(activeGroup.getBoundingClientRect().height)
            },
            opacity: window.getComputedStyle(activeGroup).opacity
          } : null,
          heroTitle: heroTitle ? {
            opacity: window.getComputedStyle(heroTitle).opacity,
            transform: heroTitle.style.transform
          } : null
        };
      })()`,
      returnByValue: true
    });

    telemetry.push(probe.result.value);
    console.log(`[${targetT}ms] Saved ${filename}`);
    frameIdx++;
  }

  fs.writeFileSync(
    path.join(outDir, 'telemetry.json'),
    JSON.stringify(telemetry, null, 2)
  );

  console.log(`Successfully extracted ${telemetry.length} frames and telemetry to ${outDir}`);
  ws.close();
}

run().catch(console.error);
