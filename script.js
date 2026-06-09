const progress = document.querySelector(".progress");
const revealItems = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll(".count");
const tiltItems = document.querySelectorAll(".tilt");
const chartItems = document.querySelectorAll(".chart-viz");
const topbar = document.querySelector(".topbar");
let lastScrollY = window.scrollY;

const svgNS = "http://www.w3.org/2000/svg";
const makeSvg = (width, height) => {
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("aria-hidden", "true");
  return svg;
};

const svgEl = (name, attrs = {}, text) => {
  const node = document.createElementNS(svgNS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (text !== undefined) node.textContent = text;
  return node;
};

const linePath = (points) =>
  points.map((point, index) => `${index ? "L" : "M"} ${point[0]} ${point[1]}`).join(" ");

const polarPoint = (cx, cy, r, angle) => {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
};

const arcPath = (cx, cy, r, start, end) => {
  const [sx, sy] = polarPoint(cx, cy, r, end);
  const [ex, ey] = polarPoint(cx, cy, r, start);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 0 ${ex} ${ey} L ${cx} ${cy} Z`;
};

const addText = (parent, attrs, text) => {
  const node = svgEl("text", attrs, text);
  parent.appendChild(node);
  return node;
};

const drawSubsidyRatio = (root) => {
  const data = [
    { year: "2021", total: "1,201,140", pct: 4.6 },
    { year: "2022", total: "1,351,054", pct: 8.5 },
    { year: "2023", total: "1,390,201", pct: 14.9 },
    { year: "2024", total: "834,735", pct: 25.7 },
    { year: "2025", total: "251,781", pct: 36.6 },
    { year: "2026", total: "226,406", pct: 44.8 },
  ];
  const svg = makeSvg(980, 620);
  addText(svg, { x: 32, y: 44, class: "chart-title" }, "全市場歷年租屋物件：可租補 vs 一般物件比例變化");
  addText(svg, { x: 32, y: 76, class: "chart-note" }, "資料來源：開放台灣民間租屋資料");

  data.forEach((item, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const cx = 165 + col * 315;
    const cy = 225 + row * 235;
    const r = 70;
    const start = 0;
    const end = (item.pct / 100) * 360;
    const group = svgEl("g", { style: `--delay:${index * 120}ms` });
    group.appendChild(svgEl("circle", { cx, cy, r, fill: "#79add2", opacity: "0.78" }));
    group.appendChild(svgEl("path", { d: arcPath(cx, cy, r, start, end), fill: "#d9283f", class: "chart-pie-wedge", style: `--delay:${index * 120}ms` }));
    addText(group, { x: cx, y: cy - 8, "text-anchor": "middle", class: "chart-strong chart-pie-label", style: `--delay:${index * 120 + 240}ms` }, `${item.pct}%`);
    addText(group, { x: cx, y: cy + 17, "text-anchor": "middle", class: "chart-label chart-pie-label", style: `--delay:${index * 120 + 280}ms` }, "可租補");
    addText(group, { x: cx, y: cy - 102, "text-anchor": "middle", class: "chart-strong" }, `${item.year}年`);
    addText(group, { x: cx, y: cy - 78, "text-anchor": "middle", class: "chart-label" }, `總數：${item.total}筆`);
    svg.appendChild(group);
  });

  root.appendChild(svg);
};

const drawRentGrowth = (root) => {
  const years = [2021, 2022, 2023, 2024];
  const general = [0, 2.3, 4.7, 5.8];
  const subsidy = [0, 6.0, 10.6, 12.2];
  const svg = makeSvg(980, 560);
  const left = 86;
  const right = 920;
  const top = 86;
  const bottom = 455;
  const yMax = 13;
  const x = (i) => left + (i / (years.length - 1)) * (right - left);
  const y = (v) => bottom - (v / yMax) * (bottom - top);

  addText(svg, { x: 32, y: 44, class: "chart-title" }, "雙北 2021-2024：同物件累積漲幅指數");
  addText(svg, { x: 32, y: 74, class: "chart-note" }, "基準：2021 = 0%。嚴格篩選跨年度同物件追蹤");
  [0, 5, 10].forEach((tick) => {
    const yy = y(tick);
    svg.appendChild(svgEl("line", { x1: left, y1: yy, x2: right, y2: yy, class: "chart-grid" }));
    addText(svg, { x: left - 18, y: yy + 5, "text-anchor": "end", class: "chart-axis" }, `${tick}%`);
  });
  years.forEach((year, i) => {
    addText(svg, { x: x(i), y: bottom + 40, "text-anchor": "middle", class: "chart-axis" }, year);
  });

  const drawSeries = (values, colorClass, label, delayBase) => {
    const pts = values.map((value, i) => [x(i), y(value)]);
    const path = svgEl("path", { d: linePath(pts), class: `chart-line ${colorClass}` });
    svg.appendChild(path);
    requestAnimationFrame(() => path.style.setProperty("--line-length", path.getTotalLength()));
    pts.forEach(([px, py], i) => {
      svg.appendChild(svgEl("circle", { cx: px, cy: py, r: 10, class: `chart-dot ${colorClass}`, style: `--delay:${delayBase + i * 180}ms` }));
      addText(svg, { x: px, y: py - 22, "text-anchor": "middle", class: `chart-strong chart-bar-label ${colorClass}`, style: `--delay:${delayBase + i * 180}ms` }, `${values[i].toFixed(1)}%`);
    });
    addText(svg, { x: pts.at(-1)[0] - 8, y: pts.at(-1)[1] + (label.includes("一般") ? 44 : -42), "text-anchor": "end", class: `chart-legend ${colorClass}` }, label);
  };

  drawSeries(general, "chart-blue", "一般（無租補）", 450);
  drawSeries(subsidy, "chart-red", "曾經有租補過的", 260);
  root.appendChild(svg);
};

const drawRentBand = (root) => {
  const values = [14,107,364,774,761,813,648,601,498,378,499,399,283,241,149,122,133,78,94,57,58,55,26,47,21,12,23,15,22,22,8,16,9,8,9,4,6,2,4,5,4,3,2,2,3,1,8,1];
  const bins = values
    .map((value, index) => ({ value, from: 2 + index * 2, to: 4 + index * 2 }))
    .filter((item) => item.from >= 2 && item.from < 60);
  const svg = makeSvg(980, 600);
  const left = 72;
  const right = 930;
  const top = 118;
  const bottom = 475;
  const max = 850;
  const barGap = 8;
  const barWidth = (right - left) / bins.length - barGap;
  addText(svg, { x: 32, y: 44, class: "chart-title" }, "有漲物件之初始租金區間分布");
  addText(svg, { x: 32, y: 72, class: "chart-note" }, "每 2,000 元級距；畫面保留 2,000 至 60,000 元租金帶");
  [250, 500, 750].forEach((tick) => {
    const yy = bottom - (tick / max) * (bottom - top);
    svg.appendChild(svgEl("line", { x1: left, y1: yy, x2: right, y2: yy, class: "chart-grid" }));
    addText(svg, { x: left - 12, y: yy + 5, "text-anchor": "end", class: "chart-axis" }, tick);
  });
  bins.forEach(({ value, from }, i) => {
    const x = left + i * (barWidth + barGap);
    const height = (value / max) * (bottom - top);
    const y = bottom - height;
    const isFocus = from >= 8 && from < 18;
    svg.appendChild(svgEl("rect", { x, y, width: barWidth, height, rx: 2, class: "chart-bar", fill: isFocus ? "#d9283f" : "#79add2", style: `--delay:${i * 18}ms` }));
    if ((from >= 6 && from <= 24) || from === 28 || from === 34 || from === 40) {
      const stagger = i % 2 ? 18 : 5;
      addText(svg, { x: x + barWidth / 2, y: y - stagger, "text-anchor": "middle", class: "chart-bar-label chart-strong", style: `--delay:${i * 18 + 280}ms` }, value);
    }
  });

  const tickStarts = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 34, 40, 50, 58];
  tickStarts.forEach((from) => {
    const idx = bins.findIndex((item) => item.from === from);
    if (idx < 0) return;
    const x = left + idx * (barWidth + barGap) + barWidth / 2;
    const label = from === 58 ? "58-60k" : `${from}-${from + 2}k`;
    const text = addText(svg, { x, y: bottom + 36, "text-anchor": "end", class: "chart-axis" }, label);
    text.setAttribute("transform", `rotate(-38 ${x} ${bottom + 36})`);
  });
  addText(svg, { x: (left + right) / 2, y: 575, "text-anchor": "middle", class: "chart-axis" }, "初始月租金區間");

  const focusStart = bins.findIndex((item) => item.from === 8);
  const focusEnd = bins.findIndex((item) => item.from === 16);
  const focusX = left + focusStart * (barWidth + barGap) - 8;
  const focusWidth = (focusEnd - focusStart + 1) * (barWidth + barGap) + 8;
  svg.appendChild(svgEl("rect", { x: focusX, y: top + 8, width: focusWidth, height: bottom - top - 8, fill: "none", stroke: "#d9283f", "stroke-width": 2, "stroke-dasharray": "7 7", opacity: 0.55 }));
  addText(svg, { x: focusX + focusWidth / 2, y: top - 18, "text-anchor": "middle", class: "chart-strong chart-red" }, "8,000-18,000元最集中");
  root.appendChild(svg);
};

const drawWordChart = (root, tone) => {
  const blue = tone === "blue";
  const data = blue
    ? [
        { text: "獨立套房 + 精裝 + 近捷運 + 無電梯 + 不可寵", value: 590 },
        { text: "獨立套房 + 精裝 + 近捷運 + 有電梯 + 不可寵", value: 403 },
        { text: "獨立套房 + 中檔裝潢 + 近捷運 + 無電梯 + 不可寵", value: 275 },
        { text: "獨立套房 + 精裝 + 近捷運 + 無電梯 + 可養寵", value: 252 },
        { text: "獨立套房 + 中檔裝潢 + 近捷運 + 有電梯 + 不可寵", value: 159 },
        { text: "分租套房 + 精裝 + 近捷運 + 無電梯 + 不可寵", value: 122 },
        { text: "獨立套房 + 中檔裝潢 + 非捷運 + 無電梯 + 不可寵", value: 122 },
        { text: "獨立套房 + 精裝 + 近捷運 + 有電梯 + 可養寵", value: 108 },
        { text: "整層住家 + 精裝 + 非捷運 + 有電梯 + 不可寵", value: 93 },
        { text: "整層住家 + 基礎裝潢 + 近捷運 + 無電梯 + 不可寵", value: 90 },
        { text: "整層住家 + 精裝 + 近捷運 + 無電梯 + 不可寵", value: 80 },
        { text: "獨立套房 + 中檔裝潢 + 非捷運 + 有電梯 + 不可寵", value: 76 },
        { text: "整層住家 + 中檔裝潢 + 近捷運 + 無電梯 + 不可寵", value: 75 },
        { text: "整層住家 + 中檔裝潢 + 非捷運 + 有電梯 + 不可寵", value: 74 },
        { text: "獨立套房 + 中檔裝潢 + 近捷運 + 無電梯 + 可養寵", value: 72 },
        { text: "獨立套房 + 精裝 + 非捷運 + 無電梯 + 不可寵", value: 70 },
        { text: "整層住家 + 精裝 + 近捷運 + 有電梯 + 不可寵", value: 67 },
        { text: "分租套房 + 精裝 + 近捷運 + 有電梯 + 不可寵", value: 64 },
        { text: "整層住家 + 基礎裝潢 + 非捷運 + 無電梯 + 不可寵", value: 61 },
        { text: "分租套房 + 中檔裝潢 + 近捷運 + 無電梯 + 不可寵", value: 51 },
      ]
    : [
        { text: "整層住家 + 中檔裝潢 + 非捷運 + 有電梯 + 不可寵", value: 53.0 },
        { text: "整層住家 + 精裝 + 非捷運 + 有電梯 + 不可寵", value: 49.0 },
        { text: "整層住家 + 中檔裝潢 + 近捷運 + 無電梯 + 不可寵", value: 44.2 },
        { text: "整層住家 + 精裝 + 近捷運 + 有電梯 + 不可寵", value: 37.7 },
        { text: "整層住家 + 中檔裝潢 + 非捷運 + 無電梯 + 不可寵", value: 32.1 },
        { text: "整層住家 + 精裝 + 近捷運 + 無電梯 + 不可寵", value: 30.1 },
        { text: "整層住家 + 基礎裝潢 + 非捷運 + 無電梯 + 不可寵", value: 27.3 },
        { text: "整層住家 + 基礎裝潢 + 近捷運 + 無電梯 + 不可寵", value: 26.1 },
        { text: "整層住家 + 精裝 + 近捷運 + 無電梯 + 可養寵", value: 25.0 },
        { text: "整層住家 + 基礎裝潢 + 近捷運 + 無電梯 + 可養寵", value: 20.0 },
        { text: "獨立套房 + 基礎裝潢 + 近捷運 + 有電梯 + 不可寵", value: 20.0 },
        { text: "獨立套房 + 中檔裝潢 + 非捷運 + 有電梯 + 不可寵", value: 19.7 },
        { text: "獨立套房 + 中檔裝潢 + 非捷運 + 無電梯 + 不可寵", value: 18.0 },
        { text: "獨立套房 + 中檔裝潢 + 近捷運 + 無電梯 + 不可寵", value: 16.7 },
        { text: "分租套房 + 中檔裝潢 + 近捷運 + 無電梯 + 不可寵", value: 15.8 },
        { text: "獨立套房 + 中檔裝潢 + 近捷運 + 有電梯 + 不可寵", value: 15.1 },
        { text: "獨立套房 + 中檔裝潢 + 近捷運 + 有電梯 + 可養寵", value: 14.9 },
        { text: "分租套房 + 中檔裝潢 + 非捷運 + 無電梯 + 不可寵", value: 13.6 },
        { text: "獨立套房 + 精裝 + 近捷運 + 有電梯 + 不可寵", value: 13.0 },
        { text: "獨立套房 + 精裝 + 近捷運 + 有電梯 + 可養寵", value: 12.2 },
      ];
  const values = data.map((item) => item.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const minSize = 18;
  const maxSize = blue ? 33 : 32;
  const sizeFor = (value) => {
    const ratio = (Math.sqrt(value) - Math.sqrt(minValue)) / (Math.sqrt(maxValue) - Math.sqrt(minValue));
    return minSize + ratio * (maxSize - minSize);
  };
  const positions = [
    [150, 150], [865, 205], [225, 265], [940, 325], [165, 385],
    [925, 445], [290, 505], [1010, 565], [155, 625], [850, 685],
    [315, 745], [980, 805], [170, 865], [865, 925], [285, 985],
    [1000, 1045], [150, 1105], [900, 1165], [315, 1225], [980, 1285],
  ];
  const svg = makeSvg(1700, 1360);
  addText(svg, { x: 40, y: 54, class: "chart-title" }, blue ? "8k-18k 有漲物件條件組合" : "2k-18k 易遭調漲組合排行");
  addText(svg, { x: 40, y: 92, class: "chart-note" }, blue ? "字體越大代表筆數越多" : "字體越大代表調漲幅度越高");
  data.forEach((item, i) => {
    const [x, y] = positions[i];
    const size = sizeFor(item.value);
    const opacity = Math.max(0.32, 1 - i * 0.032);
    const group = svgEl("g", {
      class: `chart-word ${blue ? "blue" : "red"}${i < 3 ? " top-rank" : ""}`,
      style: `--delay:${i * 95}ms; --word-opacity:${opacity}`,
      transform: `translate(${x} ${y})`,
    });
    group.appendChild(svgEl("text", { "font-size": size.toFixed(1), "text-anchor": "start" }, item.text));
    svg.appendChild(group);
  });
  root.appendChild(svg);
};

const renderChart = (node) => {
  if (node.dataset.rendered) return;
  node.dataset.rendered = "true";
  const type = node.dataset.chart;
  if (type === "subsidy-ratio") drawSubsidyRatio(node);
  if (type === "rent-growth") drawRentGrowth(node);
  if (type === "rent-band") drawRentBand(node);
  if (type === "combo-count") drawWordChart(node, "blue");
  if (type === "combo-growth") drawWordChart(node, "red");
};

chartItems.forEach(renderChart);

const formatNumber = (value, decimals) =>
  new Intl.NumberFormat("zh-Hant", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);

const animateCounter = (node) => {
  const target = Number(node.dataset.target);
  const decimals = String(node.dataset.target).includes(".") ? 1 : 0;
  const duration = 1200;
  const start = performance.now();
  const runId = String(start);
  node.dataset.runId = runId;

  const tick = (now) => {
    if (node.dataset.runId !== runId) return;
    const progressValue = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progressValue, 3);
    node.textContent = formatNumber(target * eased, decimals);
    if (progressValue < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const countersInSection = entry.target.querySelectorAll(".count");
      const chartsInSection = entry.target.querySelectorAll(".chart-viz");

      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        countersInSection.forEach(animateCounter);
        chartsInSection.forEach((chart) => chart.classList.add("chart-on"));
        return;
      }

      entry.target.classList.remove("in-view");
      countersInSection.forEach((counter) => {
        counter.dataset.runId = "";
        counter.textContent = "0";
      });
      chartsInSection.forEach((chart) => chart.classList.remove("chart-on"));
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach((item) => observer.observe(item));
counters.forEach((counter) => {
  if (counter.closest(".hero")) animateCounter(counter);
});

const updateProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  progress.style.width = `${Math.min(ratio * 100, 100)}%`;

  if (!topbar) return;
  const currentY = window.scrollY;
  const delta = currentY - lastScrollY;

  if (currentY < 80 || delta < -6) {
    topbar.classList.remove("is-hidden");
  } else if (delta > 6) {
    topbar.classList.add("is-hidden");
  }

  lastScrollY = currentY;
};

window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

tiltItems.forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    const rect = item.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    item.style.transform = `rotateX(${y * -5}deg) rotateY(${x * 5}deg) translateY(-4px)`;
  });

  item.addEventListener("pointerleave", () => {
    item.style.transform = "";
  });
});
