const progress = document.querySelector(".progress");
const revealItems = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll(".count");
const tiltItems = document.querySelectorAll(".tilt");
const chartItems = document.querySelectorAll(".chart-viz");

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
  const svg = makeSvg(980, 560);
  addText(svg, { x: 32, y: 44, class: "chart-title" }, "全市場歷年租屋物件：可租補 vs 一般物件比例變化");
  addText(svg, { x: 32, y: 76, class: "chart-note" }, "掃描範圍：全台 591 租屋網全量歷史貼文");

  data.forEach((item, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const cx = 165 + col * 315;
    const cy = 190 + row * 210;
    const r = 70;
    const start = 0;
    const end = (item.pct / 100) * 360;
    const group = svgEl("g", { style: `--delay:${index * 120}ms` });
    group.appendChild(svgEl("circle", { cx, cy, r, fill: "#8c98ad", opacity: "0.72" }));
    group.appendChild(svgEl("path", { d: arcPath(cx, cy, r, start, end), fill: "#e7213c", class: "chart-pie-wedge", style: `--delay:${index * 120}ms` }));
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
  const svg = makeSvg(980, 520);
  const left = 58;
  const right = 938;
  const top = 82;
  const bottom = 430;
  const max = 850;
  const barGap = 4;
  const barWidth = (right - left) / values.length - barGap;
  addText(svg, { x: 32, y: 44, class: "chart-title" }, "有漲物件之初始租金區間分布");
  addText(svg, { x: 32, y: 72, class: "chart-note" }, "每 2,000 元級距，件數集中在 8,000 至 18,000 元");
  [250, 500, 750].forEach((tick) => {
    const yy = bottom - (tick / max) * (bottom - top);
    svg.appendChild(svgEl("line", { x1: left, y1: yy, x2: right, y2: yy, class: "chart-grid" }));
    addText(svg, { x: left - 12, y: yy + 5, "text-anchor": "end", class: "chart-axis" }, tick);
  });
  values.forEach((value, i) => {
    const x = left + i * (barWidth + barGap);
    const height = (value / max) * (bottom - top);
    const y = bottom - height;
    const isFocus = i >= 3 && i <= 8;
    svg.appendChild(svgEl("rect", { x, y, width: barWidth, height, rx: 2, class: "chart-bar", fill: isFocus ? "#e7213c" : "#8c98ad", style: `--delay:${i * 18}ms` }));
    if ([3, 4, 5, 6, 7, 10].includes(i)) {
      addText(svg, { x: x + barWidth / 2, y: y - 8, "text-anchor": "middle", class: "chart-bar-label chart-strong", style: `--delay:${i * 18 + 280}ms` }, value);
    }
  });
  ["8k", "12k", "16k", "20k", "30k", "40k", "60k", "80k", "100k"].forEach((label, i) => {
    const idx = [3,5,7,9,14,19,29,39,47][i];
    addText(svg, { x: left + idx * (barWidth + barGap), y: bottom + 30, "text-anchor": "middle", class: "chart-axis" }, label);
  });
  svg.appendChild(svgEl("rect", { x: left + 3 * (barWidth + barGap) - 8, y: top + 8, width: 6 * (barWidth + barGap) + 10, height: bottom - top - 8, fill: "none", stroke: "#e7213c", "stroke-width": 2, "stroke-dasharray": "6 6", opacity: 0.55 }));
  addText(svg, { x: left + 6 * (barWidth + barGap), y: top + 32, "text-anchor": "middle", class: "chart-strong chart-red" }, "8,000-18,000元");
  root.appendChild(svg);
};

const drawWordChart = (root, tone) => {
  const blue = tone === "blue";
  const items = blue
    ? [
        ["獨立套房 + 精裝 + 近捷運 + 有電梯 + 不可寵", 39, 510, 130],
        ["獨立套房 + 精裝 + 近捷運 + 無電梯 + 不可寵", 35, 510, 255],
        ["獨立套房 + 中檔裝潢 + 近捷運 + 有電梯 + 不可寵", 31, 535, 375],
        ["分租套房 + 中檔裝潢 + 近捷運 + 無電梯 + 不可寵", 24, 315, 202],
        ["整層住家 + 基礎裝潢 + 近捷運 + 無電梯 + 可養寵", 24, 315, 475],
        ["獨立套房 + 精裝 + 非捷運 + 無電梯 + 不可寵", 27, 372, 315],
        ["整層住家 + 中檔裝潢 + 非捷運 + 有電梯 + 不可寵", 24, 665, 488],
        ["分租套房 + 精裝 + 近捷運 + 無電梯 + 不可寵", 23, 715, 205],
      ]
    : [
        ["整層住家 + 中檔裝潢 + 非捷運 + 有電梯 + 不可寵", 39, 505, 132],
        ["整層住家 + 精裝 + 非捷運 + 有電梯 + 不可寵", 35, 520, 260],
        ["整層住家 + 中檔裝潢 + 近捷運 + 無電梯 + 不可寵", 32, 520, 380],
        ["獨立套房 + 中檔裝潢 + 近捷運 + 有電梯 + 不可寵", 27, 590, 485],
        ["分租套房 + 精裝 + 近捷運 + 無電梯 + 不可寵", 24, 330, 202],
        ["整層住家 + 基礎裝潢 + 非捷運 + 無電梯 + 可養寵", 27, 370, 500],
        ["獨立套房 + 精裝 + 近捷運 + 無電梯 + 不可寵", 25, 700, 320],
      ];
  const svg = makeSvg(980, 560);
  addText(svg, { x: 32, y: 48, class: "chart-title" }, blue ? "8k-18k 有漲物件條件組合" : "2k-18k 易遭調漲組合排行");
  addText(svg, { x: 32, y: 78, class: "chart-note" }, blue ? "字體越大代表受害數量／筆數越多" : "字體越大代表調漲幅度越高");
  items.forEach(([text, size, x, y], i) => {
    const parts = text.split(" + ");
    const lines = [parts.slice(0, 3).join(" + "), parts.slice(3).join(" + ")];
    const group = svgEl("g", { class: `chart-word ${blue ? "blue" : "red"}`, style: `--delay:${i * 120}ms`, transform: `translate(${x} ${y})` });
    const estimatedWidth = Math.max(...lines.map((line) => line.length)) * size + 34;
    const lineHeight = size * 1.18;
    const boxHeight = lineHeight * 2 + 24;
    group.appendChild(svgEl("rect", { x: -estimatedWidth / 2, y: -boxHeight / 2, width: estimatedWidth, height: boxHeight, rx: 8 }));
    const textNode = svgEl("text", { "font-size": size });
    lines.forEach((line, lineIndex) => {
      textNode.appendChild(svgEl("tspan", { x: 0, y: (lineIndex - 0.5) * lineHeight + size * 0.18 }, line));
    });
    group.appendChild(textNode);
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
  if (node.dataset.done) return;
  node.dataset.done = "true";

  const target = Number(node.dataset.target);
  const decimals = String(node.dataset.target).includes(".") ? 1 : 0;
  const duration = 1200;
  const start = performance.now();

  const tick = (now) => {
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
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in-view");
      entry.target.querySelectorAll(".count").forEach(animateCounter);
      entry.target.querySelectorAll(".chart-viz").forEach((chart) => chart.classList.add("chart-on"));
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item) => observer.observe(item));
counters.forEach((counter) => {
  if (counter.closest(".hero")) animateCounter(counter);
});

const updateProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  progress.style.width = `${Math.min(ratio * 100, 100)}%`;
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
