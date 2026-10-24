const http = require("http");

function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get("http://127.0.0.1:9222/json", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const list = JSON.parse(data);
          const page = list.find((p) => p.type === "page" && p.url.includes("3000"));
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

async function run() {
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

  const evalExpr = async (expr) => {
    const res = await sendCommand(ws, "Runtime.evaluate", {
      expression: expr,
      returnByValue: true
    });
    return res.result?.value ?? res.value;
  };

  // Navigate to home stack
  await sendCommand(ws, "Page.navigate", { url: "http://localhost:3000/" });
  await new Promise(r => setTimeout(r, 1500));

  const stackMeasurements = await evalExpr(`(() => {
    const stack = document.querySelector('[class*="stack"]');
    const groups = Array.from(document.querySelectorAll('[class*="stackGroup"]'));
    return {
      windowWidth: window.innerWidth,
      stack: stack ? {
        className: stack.className,
        width: stack.getBoundingClientRect().width,
        left: stack.getBoundingClientRect().left,
        right: stack.getBoundingClientRect().right,
        computedWidth: window.getComputedStyle(stack).width,
        computedMarginLeft: window.getComputedStyle(stack).marginLeft,
        computedMarginRight: window.getComputedStyle(stack).marginRight,
      } : null,
      firstGroup: groups[0] ? {
        width: groups[0].getBoundingClientRect().width,
        left: groups[0].getBoundingClientRect().left,
        right: groups[0].getBoundingClientRect().right,
      } : null,
      firstGroupCover: groups[0] && groups[0].querySelector('[class*="stackCover"]') ? {
        width: groups[0].querySelector('[class*="stackCover"]').getBoundingClientRect().width,
        left: groups[0].querySelector('[class*="stackCover"]').getBoundingClientRect().left,
        right: groups[0].querySelector('[class*="stackCover"]').getBoundingClientRect().right,
      } : null,
      firstGroupCat: groups[0] && groups[0].querySelector('[class*="stackCoverCategory"]') ? {
        text: groups[0].querySelector('[class*="stackCoverCategory"]').innerText,
        width: groups[0].querySelector('[class*="stackCoverCategory"]').getBoundingClientRect().width,
        left: groups[0].querySelector('[class*="stackCoverCategory"]').getBoundingClientRect().left,
        right: groups[0].querySelector('[class*="stackCoverCategory"]').getBoundingClientRect().right,
      } : null,
    };
  })()`);

  console.log("STACK MEASUREMENTS:", JSON.stringify(stackMeasurements, null, 2));

  // Now unfold group 0 and click first tab
  await evalExpr(`(() => {
    const cover = document.querySelectorAll('[class*="stackCover"]')[0];
    if (cover) cover.click();
  })()`);
  await new Promise(r => setTimeout(r, 800));

  await evalExpr(`(() => {
    const tab = document.querySelector('[class*="stackPage"] [class*="folderTab"]');
    if (tab) tab.click();
  })()`);
  await new Promise(r => setTimeout(r, 1600));

  // Now measure inside ReaderView (opened folder)
  const readerMeasurements = await evalExpr(`(() => {
    const caseFolder = document.querySelector('[class*="caseFolder"]');
    const caseFolderCover = document.querySelector('[class*="caseFolderCover"]');
    const caseFolderCoverFront = document.querySelector('[class*="caseFolderCoverFront"]');
    const caseContent = document.querySelector('[class*="caseContent"]');
    const caseContentInner = document.querySelector('[class*="caseContentInner"]');
    const topTabs = document.querySelector('[class*="caseFolder"] [class*="stackPage"]');

    return {
      caseContent: caseContent ? {
        width: caseContent.getBoundingClientRect().width,
        left: caseContent.getBoundingClientRect().left,
        right: caseContent.getBoundingClientRect().right,
        computedWidth: window.getComputedStyle(caseContent).width,
        computedMarginLeft: window.getComputedStyle(caseContent).marginLeft,
      } : null,
      caseContentInner: caseContentInner ? {
        width: caseContentInner.getBoundingClientRect().width,
        left: caseContentInner.getBoundingClientRect().left,
        right: caseContentInner.getBoundingClientRect().right,
        computedWidth: window.getComputedStyle(caseContentInner).width,
      } : null,
      caseFolder: caseFolder ? {
        width: caseFolder.getBoundingClientRect().width,
        left: caseFolder.getBoundingClientRect().left,
        right: caseFolder.getBoundingClientRect().right,
        computedWidth: window.getComputedStyle(caseFolder).width,
      } : null,
      caseFolderCoverFront: caseFolderCoverFront ? {
        width: caseFolderCoverFront.getBoundingClientRect().width,
        computedWidth: window.getComputedStyle(caseFolderCoverFront).width,
      } : null,
      topTabs: topTabs ? {
        width: topTabs.getBoundingClientRect().width,
        left: topTabs.getBoundingClientRect().left,
        right: topTabs.getBoundingClientRect().right,
      } : null
    };
  })()`);

  console.log("READER MEASUREMENTS:", JSON.stringify(readerMeasurements, null, 2));

  ws.close();
}

run().catch(console.error);
