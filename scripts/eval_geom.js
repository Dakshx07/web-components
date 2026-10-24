const http = require('http');

async function main() {
  const data = await new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
  const page = data.find(p => p.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const send = (m, params = {}) => new Promise(r => {
    const mid = id++;
    const h = e => {
      const msg = JSON.parse(e.data);
      if (msg.id === mid) { ws.removeEventListener('message', h); r(msg.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: mid, method: m, params }));
  });
  await new Promise(r => ws.addEventListener('open', r));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const groups = Array.from(document.querySelectorAll('[class*="stackGroup"]'));
      return groups.map((g, idx) => ({
        idx,
        className: g.className,
        parent: g.parentElement.className,
        grandParent: g.parentElement.parentElement ? g.parentElement.parentElement.className : 'none',
        text: g.innerText.slice(0, 30)
      }));
    })()`,
    returnByValue: true
  });
  console.log(JSON.stringify(res.result.value, null, 2));
  ws.close();
}

main().catch(console.error);
