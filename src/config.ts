/**
 * 站点全局配置
 *
 * 这里定义了博客的基本信息、功能开关、导航菜单等。
 * 修改后保存即可自动热更新，无需重启。
 */

export const SITE = {
  // ── 基本信息 ──
  website: "https://coaar.com", // 站点完整地址，用于生成 canonical URL
  author: "Coaar", // 作者名，显示在文章页和页脚
  profile: process.env.PUBLIC_SOCIAL_GITHUB ?? "", // 作者 GitHub 主页地址，在 .env 中设置
  desc: "一个让好奇心化作代码的空间。探索 Web 开发、软件架构，以及让技术世界运转的一切。", // 站点描述，用于 meta description 和首页
  title: "Coaar's Blog", // 站点标题，显示在浏览器标签
  ogImage: "coaar-og.webp", // 社交分享预览图（放在 public 文件夹下）

  // ── 主题与样式 ──
  lightAndDarkMode: true, // 是否启用浅色 / 深色模式切换
  dir: "ltr", // 文字方向："ltr"（从左到右）| "rtl"（从右到左）| "auto"（自动）
  lang: "zh-CN", // html lang 属性，留空则默认 "en"
  timezone: "Asia/Shanghai", // 全局默认时区（IANA 格式）

  // ── 文章列表 ──
  postPerIndex: 6, // 首页显示的文章数量
  postPerPage: 12, // 文章列表页每页显示数量
  scheduledPostMargin: 15 * 60 * 1000, // 定时发布的提前检查时间（毫秒）

  // ── 功能开关 ──
  showArchives: true, // 是否显示「归档」页面入口
  showGalleries: true, // 是否启用图集功能
  showGalleriesInIndex: true, // 首页是否也显示图集（仅 showGalleries 为 true 时生效）
  showBackButton: true, // 文章详情页是否显示返回按钮
  showTagsInCards: true, // 文章卡片底部是否显示标签
  showCoverImages: true, // 文章卡片是否显示封面图（frontmatter 中的 cover）
  indexPostsGrid: true, // 首页最近文章是否用网格布局（类似 /posts 页面）

  // ── 首页终端提示词 ──
  heroTerminalPrompt: {
    prefix: "~", // 左侧高亮部分
    path: "/hello-world!", // 中间主提示文字
    suffix: "$", // 右侧终端符号
  },

  // ── 页面背景特效 ──
  backdropEffects: {
    cursorGlow: true, // 是否启用鼠标跟随光晕
    grain: true, // 是否启用背景噪点纹理
  },

  // ── 编辑链接 ──
  editPost: {
    enabled: false, // 是否在文章底部显示「编辑本文」链接
    text: "编辑本文",
    url: process.env.PUBLIC_EDIT_POST_URL ?? "", // 在 .env 中设置
  },

  // ── 首页电台播放器 ──
  introAudio: {
    enabled: false, // 是否在导航栏显示电台播放器
    src: "https://fluxfm.streamabc.net/flx-chillhop-mp3-128-8581707", // 音频地址（放在 /public 下或用完整 URL）
    isStream: true, // 是否为直播流（true 则持续播放不自动停止）
    label: "LOFI", // 播放器上显示的标签文字
    duration: 30, // 本地音频时长（秒），直播流忽略此字段
  },

  // ── 左下角悬浮音乐播放器 ──
  musicPlayer: {
    enabled: true, // 是否显示左下角悬浮音乐播放器
    server: "netease", // 音乐源：netease | tencent | kugou | xiami | joox
    type: "playlist", // 播放列表类型：playlist | song | album | artist
    id: "996182940", // 歌单 / 单曲 / 专辑 / 艺人 ID
    api: "https://mt.coaar.com/", // 主 Meting API 地址
    fallbackApis: [ // 备用 API 列表，主 API 失败时依次尝试
      "https://meting.jmstrand.cn/",
      "https://api.injahow.cn/meting/",
    ],
  },

  // ── 顶部导航菜单 ──
  navMenu: [
    { href: "/posts", label: "文章", icon: null },
    { href: "/tags", label: "标签", icon: null },
    { href: "/about", label: "关于", icon: null },
    { href: "/search", label: "搜索", icon: null },
    { href: "/archives", label: "归档", icon: "archive", enabledKey: "showArchives" }, 
    { href: "/galleries", label: "图集", icon: "gallery", enabledKey: "showGalleries" },
  ],
} as const;

/** 从 SITE 配置生成导航菜单（自动处理 enabledKey 开关） */
export function getNavMenu() {
  return SITE.navMenu.filter(item => {
    if (!item.enabledKey) return true;
    return (SITE as Record<string, unknown>)[item.enabledKey] === true;
  });
}
