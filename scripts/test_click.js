const fs = require('fs');

async function test() {
  const wsUrl = 'ws://localhost:9222/devtools/page/0913C115D2AD99F5D25B540801F42F3C';
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const mid = id++;
    const h = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === mid) {
        ws.removeEventListener('message', h);
        resolve(m.result || m.error);
      }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

  console.log("Navigating fresh to home...");
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await new Promise(r => setTimeout(r, 2000));

  const clickResult = await send("Runtime.evaluate", {
    expression: `(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const marySpan = spans.find(s => s.innerText === "Mary Colter");
      if (!marySpan) return { ok: false, error: "no span" };
      const tab = marySpan.closest('[class*="stackPageHeader"] > div');
      if (!tab) return { ok: false, error: "no tab container" };
      tab.click();
      return { ok: true, text: marySpan.innerText, class: tab.className };
    })()`,
    returnByValue: true
  });
  console.log("Click result:", clickResult.result.value);

  await new Promise(r => setTimeout(r, 2200));

  const stateAfterOpen = await send("Runtime.evaluate", {
    expression: `(() => {
      const h1 = document.querySelector("h1")?.innerText;
      const logo = document.querySelector('[class*="theLogo"]');
      return {
        h1,
        logoExists: !!logo,
        logoCursor: logo?.style?.cursor,
        pageClass: document.querySelector("main")?.firstElementChild?.className
      };
    })()`,
    returnByValue: true
  });
  console.log("State after open:", stateAfterOpen.result.value);

  // Now trigger close via clicking the logo
  console.log("Clicking the logo to close...");
  const closeResult = await send("Runtime.evaluate", {
    expression: `(() => {
      const logo = document.querySelector('[class*="theLogo"]');
      if (!logo) return { ok: false, error: "no logo" };
      logo.click();
      return { ok: true };
    })()`,
    returnByValue: true
  });
  console.log("Close click result:", closeResult.result.value);

  // Monitor over the next 2.2s
  for (let t = 200; t <= 2200; t += 400) {
    await new Promise(r => setTimeout(r, 400));
    const st = await send("Runtime.evaluate", {
      expression: `(() => {
        return {
          h1: document.querySelector("h1")?.innerText,
          pageClass: document.querySelector("main")?.firstElementChild?.className,
          folderTransform: document.querySelector('[class*="caseFolder"]')?.style?.transform
        };
      })()`,
      returnByValue: true
    });
    console.log(`t = ${t}ms:`, st.result.value);
  }

  ws.close();
}

test().catch(console.error);
