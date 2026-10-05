// Constants
const THEME = "theme";
const LIGHT = "light";
const DARK = "dark";

// Initial color scheme
// Can be "light", "dark", or empty string for system's prefers-color-scheme
const initialColorScheme = "dark";

function getPreferTheme(): string {
  // get theme data from local storage (user's explicit choice)
  const currentTheme = localStorage.getItem(THEME);
  if (currentTheme) return currentTheme;

  // return initial color scheme if it is set (site default)
  if (initialColorScheme) return initialColorScheme;

  // return user device's prefer color scheme (system fallback)
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? DARK
    : LIGHT;
}

// Use existing theme value from inline script if available, otherwise detect
let themeValue = window.theme?.themeValue ?? getPreferTheme();

// 缓存 theme-color meta 的值，避免 getComputedStyle 强制同步 reflow
let cachedThemeColor: string | null = null;

function setPreference(): void {
  localStorage.setItem(THEME, themeValue);
  reflectPreference();
}

function reflectPreference(): void {
  document.firstElementChild?.setAttribute("data-theme", themeValue);
  document.querySelector("#theme-btn")?.setAttribute("aria-label", themeValue);

  // 直接用 CSS 变量更新 theme-color meta，跳过 getComputedStyle
  // 避免在 View Transition swap 期间触发强制同步 reflow
  if (!cachedThemeColor) {
    // 首次：读取 meta 里已有值（来自 Layout.astro 服务端渲染）
    cachedThemeColor =
      document
        .querySelector("meta[name='theme-color']")
        ?.getAttribute("content") ?? null;
  }
  if (cachedThemeColor) {
    document
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", cachedThemeColor);
  }
}

// Update the global theme API
if (window.theme) {
  window.theme.setPreference = setPreference;
  window.theme.reflectPreference = reflectPreference;
} else {
  window.theme = {
    themeValue,
    setPreference,
    reflectPreference,
    getTheme: () => themeValue,
    setTheme: (val: string) => {
      themeValue = val;
    },
  };
}

// 确保主题已同步（inline 脚本可能在 body ready 前执行）
reflectPreference();

// 用 AbortController 移除旧 listener，避免 cloneNode + replaceWith 的 DOM mutation
// （cloneNode 会强制同步 reflow，在 View Transition 期间尤为昂贵）
let themeListenerCleanup: AbortController | null = null;

function setThemeFeature(): void {
  // 清理旧 listener
  if (themeListenerCleanup) themeListenerCleanup.abort();
  themeListenerCleanup = new AbortController();
  const { signal } = themeListenerCleanup;

  // set on load so screen readers can get the latest value on the button
  reflectPreference();

  const toggleTheme = () => {
    themeValue = themeValue === LIGHT ? DARK : LIGHT;
    window.theme?.setTheme(themeValue);
    setPreference();
  };

  const themeBtn = document.querySelector("#theme-btn");
  themeBtn?.addEventListener("click", toggleTheme, { signal });

  const themeBtnMobile = document.querySelector("#theme-btn-mobile");
  themeBtnMobile?.addEventListener("click", toggleTheme, { signal });
}

// 首次 setup
setThemeFeature();

// View Transition 后 setup：用 queueMicrotask 让出主线程
// 避免在 swap 动画期间阻塞关键渲染帧
document.addEventListener("astro:after-swap", () => {
  queueMicrotask(setThemeFeature);
});

// Set theme-color value before page transition
// to avoid navigation bar color flickering in Android dark mode
document.addEventListener("astro:before-swap", event => {
  const astroEvent = event;
  const bgColor = document
    .querySelector("meta[name='theme-color']")
    ?.getAttribute("content");

  if (bgColor) {
    astroEvent.newDocument
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", bgColor);
  }
});

// sync with system changes
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", ({ matches: isDark }) => {
    themeValue = isDark ? DARK : LIGHT;
    window.theme?.setTheme(themeValue);
    setPreference();
  });
