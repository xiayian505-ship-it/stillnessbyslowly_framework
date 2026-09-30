/* SBS Framework｜outline
   Tabs 功能直接引用慢慢軍火庫，不在 Framework 重寫。
*/
(function (global) {
  "use strict";

  const root = document.getElementById("outlineTabs");
  if (!root) return;

  if (!global.SlowlyTabs?.create) {
    console.error("[outline] SlowlyTabs 尚未載入。");
    return;
  }

  const initial =
    root.querySelector('[data-view-target][aria-selected="true"]')?.dataset.viewTarget ||
    root.querySelector("[data-view-target]")?.dataset.viewTarget;

  if (!initial) return;

  global.SlowlyTabs.create("#outlineTabs", { initial });
})(window);
