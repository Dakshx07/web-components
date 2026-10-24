const http = require("http");
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "../public/motion_reference/verified_two_flap_editor");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http
      .get("http://127.0.0.1:9222/json", (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          const pages = JSON.parse(data);
          const page = pages.find((p) => p.type === "page" && p.url.includes("3000"));
          if (page) resolve(page.webSocketDebuggerUrl);
          else reject(new Error("No page target found on port 9222"));
        });
      })
      .on("error", reject);
  });
}

async function main() {
  const wsUrl = await getWsUrl();
  console.log("Connecting to Chrome CDP at:", wsUrl);
  const ws = new WebSocket(wsUrl);

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === msgId) {
          ws.removeEventListener("message", handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
  console.log("Connected to Chrome via CDP.");

  // Enable Page & Runtime
  await send("Page.enable");
  await send("Runtime.enable");

  // Reload page to start clean on Home Stack
  console.log("Navigating to http://localhost:3000/ ...");
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Capture Home Stack
  let shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(outDir, "01_home_stack.png"), Buffer.from(shot.data, "base64"));
  console.log("Captured 01_home_stack.png");

  // 2. Click folder (Frank Lloyd Wright or Mary Colter)
  console.log("Clicking stack tab to open...");
  const clickRes = await send("Runtime.evaluate", {
    expression: `
      (function() {
        const tabs = Array.from(document.querySelectorAll('div[class*="tag"]'));
        const target = tabs.find(t => t.textContent.includes('Frank Lloyd Wright') || t.textContent.includes('Mary Colter'));
        if (target) {
          target.click();
          return 'Clicked tab: ' + target.textContent.trim();
        }
        return 'Tab not found';
      })()
    `,
    returnByValue: true,
  });
  console.log("Tab click result:", clickRes.result.value);

  // Capture mid-flight tilt at ~400ms
  await new Promise((r) => setTimeout(r, 400));
  shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(outDir, "02_mid_flight_tilt.png"), Buffer.from(shot.data, "base64"));
  console.log("Captured 02_mid_flight_tilt.png");

  // Wait for opening timeline to settle (~1.6s)
  await new Promise((r) => setTimeout(r, 1600));
  shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(outDir, "03_two_flap_opened_spread.png"), Buffer.from(shot.data, "base64"));
  console.log("Captured 03_two_flap_opened_spread.png");

  // 3. Inspect layout geometry
  const geometryResult = await send("Runtime.evaluate", {
    expression: `
      (function() {
        const folder = document.querySelector("[class*='caseFolder']");
        const leftFlap = document.querySelector("[class*='caseFolderCoverBack']");
        const rightFlap = document.querySelector("[class*='caseFolderRightFlap']");
        const crease = document.querySelector("[class*='centerCrease']");
        const pocket = document.querySelector("[class*='sawtoothPocket']");
        const leftTab = document.querySelector("[class*='leftFlapTab']");

        return {
          windowWidth: window.innerWidth,
          folderWidth: folder ? folder.getBoundingClientRect().width : null,
          leftFlapWidth: leftFlap ? leftFlap.getBoundingClientRect().width : null,
          rightFlapWidth: rightFlap ? rightFlap.getBoundingClientRect().width : null,
          hasPocket: !!pocket,
          hasLeftTab: !!leftTab,
        };
      })()
    `,
    returnByValue: true,
  });
  console.log("Two-Flap Geometry:", geometryResult.result.value);

  // 4. Test Notion Editor Interaction (toggle to-do item)
  await send("Runtime.evaluate", {
    expression: `
      (function() {
        const checkbox = document.querySelector("input[type='checkbox']");
        if (checkbox) checkbox.click();
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 300));

  // 5. Test Slash command menu
  await send("Runtime.evaluate", {
    expression: `
      (function() {
        const textareas = document.querySelectorAll("textarea");
        const lastTa = textareas[textareas.length - 1];
        if (lastTa) {
          lastTa.focus();
          lastTa.value = "/h2";
          lastTa.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 400));
  shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(outDir, "04_slash_command_menu.png"), Buffer.from(shot.data, "base64"));
  console.log("Captured 04_slash_command_menu.png");

  // 6. Test Metadata edit
  await send("Runtime.evaluate", {
    expression: `
      (function() {
        const titleTa = document.querySelector("textarea[placeholder*='Title']");
        if (titleTa) {
          titleTa.value = "Mary Colter — Archival Field Dossier & Project Records";
          titleTa.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 300));
  shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(outDir, "05_edited_spread_persisted.png"), Buffer.from(shot.data, "base64"));
  console.log("Captured 05_edited_spread_persisted.png");

  // 7. Click left tab to trigger closing flight back to stack
  console.log("Clicking left tab to trigger closing flight...");
  await send("Runtime.evaluate", {
    expression: `
      (function() {
        const leftTab = document.querySelector("[class*='leftFlapTab']");
        if (leftTab) leftTab.click();
      })()
    `,
  });

  // Capture mid-flight closing tilt
  await new Promise((r) => setTimeout(r, 450));
  shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(outDir, "06_closing_mid_flight.png"), Buffer.from(shot.data, "base64"));
  console.log("Captured 06_closing_mid_flight.png");

  // Wait for closing flight to land
  await new Promise((r) => setTimeout(r, 1400));
  shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(outDir, "07_home_stack_restored.png"), Buffer.from(shot.data, "base64"));
  console.log("Captured 07_home_stack_restored.png");

  ws.close();
  console.log("Verification finished successfully!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
