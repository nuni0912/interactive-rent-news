const progress = document.querySelector(".progress");
const revealItems = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll(".count");
const tiltItems = document.querySelectorAll(".tilt");

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
