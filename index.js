(() => {
  "use strict";

  const groups = Array.isArray(window.SbsFrameworkIndex) ? window.SbsFrameworkIndex : [];
  const tabs = document.getElementById("groupTabs");
  const panels = document.getElementById("groupPanels");
  const searchInput = document.getElementById("frameworkSearch");
  const searchStatus = document.getElementById("searchStatus");
  const searchResults = document.getElementById("searchResults");

  function normalize(value) {
    return String(value ?? "").toLocaleLowerCase();
  }

  async function copyAbsolutePath(value, button) {
    const original = button.textContent;

    try {
      if (!window.SlowlyClipboardCopy?.copy) {
        throw new Error("ClipboardCopy 尚未載入。");
      }

      button.disabled = true;
      await window.SlowlyClipboardCopy.copy(value);
      button.textContent = "已複製";
    } catch (error) {
      console.error("[Framework] 複製絕對路徑失敗：", error);
      button.textContent = "複製失敗";
    } finally {
      window.setTimeout(() => {
        button.textContent = original;
        button.disabled = false;
      }, 1400);
    }
  }

  function createItem(item, groupId, index) {
    const card = document.createElement("article");
    card.className = "framework-item";
    card.dataset.group = groupId;
    card.dataset.index = String(index);

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = item.title || "未命名 Framework";
    card.appendChild(title);

    if (item.desc) {
      const desc = document.createElement("div");
      desc.className = "item-desc";
      desc.textContent = item.desc;
      card.appendChild(desc);
    }

    if (item.copyPath) {
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "item-copy";
      copy.textContent = "複製絕對路徑";
      copy.setAttribute("aria-label", `複製 ${item.title || "Framework"} 的絕對路徑`);
      copy.addEventListener("click", () => copyAbsolutePath(item.copyPath, copy));
      card.appendChild(copy);
    } else if (item.path) {
      const path = document.createElement("div");
      path.className = "item-path";
      path.textContent = item.path;
      card.appendChild(path);
    }

    if (Array.isArray(item.links) && item.links.length) {
      const links = document.createElement("div");
      links.className = "item-links";
      item.links.forEach((link) => {
        const a = document.createElement("a");
        a.href = link.href;
        a.textContent = link.label;
        links.appendChild(a);
      });
      card.appendChild(links);
    }

    return card;
  }

  function showPage(pageId) {
    document.querySelectorAll("[data-page]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.page === pageId));
    });
    document.querySelectorAll("[data-page-panel]").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.pagePanel === pageId);
    });
    history.replaceState(null, "", pageId === "directory" ? location.pathname : `#${encodeURIComponent(pageId)}`);
  }

  function renderGroups() {
    groups.forEach((group) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.dataset.page = group.id;
      tab.setAttribute("aria-selected", "false");
      tab.textContent = group.title;
      tab.addEventListener("click", () => showPage(group.id));
      tabs.appendChild(tab);

      const section = document.createElement("section");
      section.className = "page";
      section.dataset.pagePanel = group.id;

      const title = document.createElement("h2");
      title.textContent = group.title;
      section.appendChild(title);

      const list = document.createElement("div");
      list.className = "item-list";

      const items = Array.isArray(group.items) ? group.items : [];
      if (!items.length) {
        const empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = "這個 group 還沒有 Framework。";
        list.appendChild(empty);
      } else {
        items.forEach((item, index) => list.appendChild(createItem(item, group.id, index)));
      }

      section.appendChild(list);
      panels.appendChild(section);
    });
  }

  function buildSearchIndex() {
    return groups.flatMap((group) => (group.items || []).map((item, index) => ({
      groupId: group.id,
      groupTitle: group.title,
      index,
      item,
      text: normalize([
        group.id,
        group.title,
        group.desc,
        item.title,
        item.desc,
        item.copyPath,
        item.path,
        ...(item.keywords || []),
        ...(item.links || []).flatMap((link) => [link.label, link.href])
      ].filter(Boolean).join(" "))
    })));
  }

  function locate(entry) {
    showPage(entry.groupId);
    const card = document.querySelector(`.framework-item[data-group="${CSS.escape(entry.groupId)}"][data-index="${entry.index}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.remove("search-target");
    void card.offsetWidth;
    card.classList.add("search-target");
    window.setTimeout(() => card.classList.remove("search-target"), 1600);
  }

  function renderSearch(query, searchIndex) {
    searchResults.replaceChildren();
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean);

    if (!terms.length) {
      searchStatus.textContent = "";
      return;
    }

    const matches = searchIndex.filter((entry) => terms.every((term) => entry.text.includes(term)));
    searchStatus.textContent = matches.length ? `找到 ${matches.length} 個` : "沒有找到符合的 Framework。";

    matches.forEach((entry) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-result";

      const title = document.createElement("span");
      title.className = "search-title";
      title.textContent = entry.item.title;

      const path = document.createElement("span");
      path.className = "item-path";
      path.textContent = entry.groupTitle;

      const desc = document.createElement("span");
      desc.className = "item-desc";
      desc.textContent = entry.item.desc || "";

      button.append(title, path, desc);
      button.addEventListener("click", () => locate(entry));
      searchResults.appendChild(button);
    });
  }

  tabs.querySelector('[data-page="directory"]')?.addEventListener("click", () => showPage("directory"));
  renderGroups();
  const searchIndex = buildSearchIndex();

  const initial = decodeURIComponent(location.hash.slice(1));
  if (initial && groups.some((group) => group.id === initial)) showPage(initial);

  searchInput.addEventListener("input", () => renderSearch(searchInput.value, searchIndex));
})();
