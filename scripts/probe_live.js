const http = require('http');

async function getWs() {
  const data = await new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
  const page = data.find(p => p.type === 'page');
  return page.webSocketDebuggerUrl;
}

async function main() {
  const wsUrl = await getWs();
  const ws = new WebSocket(wsUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = id++;
    const h = e => {
      const msg = JSON.parse(e.data);
      if (msg.id === mid) {
        ws.removeEventListener('message', h);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  console.log('Connected');

  // Navigate to home and open Mary Colter
  console.log('Navigating to http://localhost:3000...');
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Clicking Mary Colter tag...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.innerText.includes('Mary Colter'));
      if (span) {
        const tag = span.closest('[class*="tag"]');
        if (tag) tag.click();
      }
    })()`
  });

  await new Promise(r => setTimeout(r, 2600));

  console.log('Clicking logo to close...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const logo = document.querySelector('[class*="theLogo"]');
      if (logo) logo.click();
    })()`
  });

  for (let i = 0; i < 35; i++) {
    await new Promise(r => setTimeout(r, 50));
    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const cf = document.querySelector('[class*="caseFolder"]');
        const cover = document.querySelector('[class*="caseFolderCover"]');
        const homeScene = document.querySelector('[class*="homeScene"]');
        const stack = document.querySelector('[class*="stack"]');
        const stackGroups = Array.from(document.querySelectorAll('[class*="stackGroup"]')).filter(el => !el.className.includes('stackGroupInner'));
        const targetGroup = stackGroups[3];

        return {
          t: ${i * 50},
          cfTop: cf ? Math.round(cf.getBoundingClientRect().top) : null,
          cfLeft: cf ? Math.round(cf.getBoundingClientRect().left) : null,
          cfTransform: cf ? cf.style.transform : null,
          coverRotateY: cover ? cover.style.transform : null,
          targetGroupTop: targetGroup ? Math.round(targetGroup.getBoundingClientRect().top) : null,
          homeSceneClass: homeScene ? homeScene.className : 'NONE',
          hasStack: !!stack
        };
      })()`,
      returnByValue: true
    });

    const v = res.result.value;
    console.log(`t=${String(v.t).padStart(4, ' ')}ms | CF Top: ${String(v.cfTop).padStart(4, ' ')} | CF Left: ${String(v.cfLeft).padStart(4, ' ')} | Transform: ${String(v.cfTransform || 'none').padEnd(35, ' ')} | TargetGroupTop: ${String(v.targetGroupTop).padStart(4, ' ')} | Class: ${v.homeSceneClass.includes('Transitioning') ? 'TRANSITION' : 'STATIC'}`);
  }

  ws.close();
}

main().catch(console.error);
