const fs = require('fs');
const http = require('http');

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const list = JSON.parse(data);
        const page = list.find(p => p.type === 'page');
        if (page) resolve(page.webSocketDebuggerUrl);
        else reject(new Error('No page target found'));
      });
    }).on('error', reject);
  });
}

async function run() {
  const wsUrl = await getWsUrl();
  console.log('Connecting to:', wsUrl);
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
  console.log('CDP Connected');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });

  console.log('Navigating to http://localhost:3000...');
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Opening Mary Colter...');
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

  // Wait 2500ms for opening animation to fully settle into case-view
  console.log('Waiting for case-view settlement...');
  await new Promise(r => setTimeout(r, 2500));

  // Trigger close by clicking theLogo
  console.log('Triggering close...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const logo = document.querySelector('[class*="theLogo"]');
      if (logo) logo.click();
    })()`
  });

  const startTime = Date.now();
  const samples = [];
  const duration = 2200; // ms
  const interval = 40; // ms

  for (let t = 0; t <= duration; t += interval) {
    const elapsed = Date.now() - startTime;
    const wait = Math.max(0, t - elapsed);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));

    const probe = await send('Runtime.evaluate', {
      expression: `(() => {
        const cf = document.querySelector('[class*="caseFolder"]');
        const cover = document.querySelector('[class*="caseFolderCover"]');
        const stackGroups = Array.from(document.querySelectorAll('[class*="stackGroup"]'));
        const activeGroup = stackGroups[3];
        const heroTitle = document.querySelector('[class*="sectionHeroTitle"]');
        const homeScene = document.querySelector('[class*="homeScene"]');

        return {
          t: ${t},
          caseFolder: cf ? {
            top: Math.round(cf.getBoundingClientRect().top),
            left: Math.round(cf.getBoundingClientRect().left),
            width: Math.round(cf.getBoundingClientRect().width),
            height: Math.round(cf.getBoundingClientRect().height),
            transform: cf.style.transform || window.getComputedStyle(cf).transform,
          } : null,
          cover: cover ? {
            transform: cover.style.transform || window.getComputedStyle(cover).transform,
          } : null,
          activeGroupInStack: activeGroup ? {
            top: Math.round(activeGroup.getBoundingClientRect().top),
            transform: activeGroup.style.transform || window.getComputedStyle(activeGroup).transform,
          } : null,
          homeSceneClass: homeScene ? homeScene.className : null,
          heroTitle: heroTitle ? {
            top: Math.round(heroTitle.getBoundingClientRect().top),
            opacity: window.getComputedStyle(heroTitle).opacity,
          } : null,
        };
      })()`,
      returnByValue: true
    });

    if (probe && probe.result && probe.result.value) {
      samples.push(probe.result.value);
    }
  }

  console.log('\n=== CLOSING TELEMETRY (Sampled every 40ms) ===');
  samples.forEach(s => {
    const cf = s.caseFolder;
    const ag = s.activeGroupInStack;
    console.log(`t=${String(s.t).padStart(4, ' ')}ms | CF top: ${cf ? String(cf.top).padStart(4, ' ') : 'null'} | CF transform: ${cf ? cf.transform.substring(0, 45) : 'none'} | StackGroup[3] top: ${ag ? ag.top : 'null'} | Class: ${s.homeSceneClass ? (s.homeSceneClass.includes('Transitioning') ? 'TRANSITION' : 'STATIC') : 'none'}`);
  });

  ws.close();
}

run().catch(console.error);
