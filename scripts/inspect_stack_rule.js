const http = require("http");

function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get("http://127.0.0.1:9222/json", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const list = JSON.parse(data);
          const page = list.find((p) => p.type === "page");
          if (page && page.webSocketDebuggerUrl) {
            resolve(page.webSocketDebuggerUrl);
          } else {
            reject(new Error("No active page found"));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === id) {
        ws.removeEventListener("message", handler);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function inspectStackRule() {
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

  const target = await sendCommand(ws, "Target.createTarget", { url: "https://www.mosbyfiles.com/" });
  const pageWsUrl = `ws://127.0.0.1:9222/devtools/page/${target.targetId}`;
  
  const pageWs = new WebSocket(pageWsUrl);
  await new Promise((resolve) => pageWs.addEventListener("open", resolve, { once: true }));

  await new Promise((r) => setTimeout(r, 4000));

  const res = await sendCommand(pageWs, "Runtime.evaluate", {
    expression: `(() => {
      const el = document.querySelector('.stack');
      const rules = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText && el.matches(rule.selectorText)) {
              rules.push({ selector: rule.selectorText, cssText: rule.cssText });
            }
          }
        } catch(e) {}
      }
      return {
        rules,
        styleAttr: el.getAttribute('style')
      };
    })()`,
    returnByValue: true
  });

  console.log("RULES MATCHING .stack:", JSON.stringify(res.result?.value, null, 2));

  await sendCommand(ws, "Target.closeTarget", { targetId: target.targetId });
  ws.close();
  pageWs.close();
}

inspectStackRule().catch(console.error);
