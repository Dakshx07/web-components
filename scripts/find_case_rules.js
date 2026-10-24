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

async function findCaseTempRules() {
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

  const target = await sendCommand(ws, "Target.createTarget", { url: "https://www.mosbyfiles.com/cases/frank-lloyd-wright" });
  const pageWsUrl = `ws://127.0.0.1:9222/devtools/page/${target.targetId}`;
  
  const pageWs = new WebSocket(pageWsUrl);
  await new Promise((resolve) => pageWs.addEventListener("open", resolve, { once: true }));

  await new Promise((r) => setTimeout(r, 4000));

  const res = await sendCommand(pageWs, "Runtime.evaluate", {
    expression: `(() => {
      const doc = document;
      const allRules = [];
      for (const sheet of doc.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.cssRules) {
              for (const sub of rule.cssRules) {
                if (sub.selectorText && (
                  sub.selectorText.includes('case-temp') ||
                  sub.selectorText.includes('case-folder') ||
                  sub.selectorText.includes('case-content')
                )) {
                  allRules.push({ media: rule.conditionText || rule.media?.mediaText, selector: sub.selectorText, cssText: sub.cssText });
                }
              }
            } else if (rule.selectorText && (
              rule.selectorText.includes('case-temp') ||
              rule.selectorText.includes('case-folder') ||
              rule.selectorText.includes('case-content')
            )) {
              allRules.push({ selector: rule.selectorText, cssText: rule.cssText });
            }
          }
        } catch(e) {}
      }
      return allRules;
    })()`,
    returnByValue: true
  });

  console.log("ALL CASE RULES (including @media):", JSON.stringify(res.result?.value, null, 2));

  await sendCommand(ws, "Target.closeTarget", { targetId: target.targetId });
  ws.close();
  pageWs.close();
}

findCaseTempRules().catch(console.error);
