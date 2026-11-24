import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const require = createRequire("d:\\8526.nl\\package.json");
const { Resvg } = require("@resvg/resvg-js");
const subsetFont = require("subset-font");

const FONT_WOFF2 = "d:\\8526.nl\\assets\\fonts\\custom-font.woff2";
const OUT_DIR = "d:\\ShintoKosei\\assets";
const WIDTH = 840;
const HEIGHT = 414;
const RENDER_WIDTH = 1680; // 2x Retina

const THEMES = {
  light: {
    surfaceLow: "#FFF0F0",
    surfaceContainer: "#FCEAE9",
    primary: "#8F4A4C",
    primaryContainer: "#FFDAD9",
    onPrimaryContainer: "#733336",
    onSurface: "#221919",
    onSurfaceVariant: "#524343",
    outlineVariant: "#D7C1C1",
    glowOpacity: "0.14",
    fishOuter: "#E5E1DD",
    fishInner: "#FAF8F5",
    fishSpiral: "#FF7096",
    fishOpacity: "0.26",
  },
  dark: {
    surfaceLow: "#221919",
    surfaceContainer: "#271D1D",
    primary: "#FFB3B3",
    primaryContainer: "#733336",
    onPrimaryContainer: "#FFDAD9",
    onSurface: "#F0DEDE",
    onSurfaceVariant: "#D7C1C1",
    outlineVariant: "#524343",
    glowOpacity: "0.16",
    fishOuter: "#3D3232",
    fishInner: "#2C2222",
    fishSpiral: "#FF8FAB",
    fishOpacity: "0.30",
  },
};

const LOCALES = {
  zh: {
    suffix: "",
    titleMain: "柠凉",
    titleSub: "· ShintoKosei",
    titleSubX: 128,
    subtitle: "Student · Developer / Designer",
    bio1: "从写代码到编曲、从建模到运维，横跨开发、设计、媒体与硬件多个方向。",
    bio2: "不精于某一领域，但乐于在每个领域里做到「能用」，慢慢把想法变成现实。",
    domains: [
      [
        { label: "全栈开发", w: 92 },
        { label: "视觉设计", w: 92 },
        { label: "音乐制作", w: 92 },
        { label: "视频剪辑", w: 92 },
        { label: "网络运维", w: 92 },
        { label: "服务器架设", w: 104 },
      ],
      [
        { label: "逆向学习", w: 92 },
        { label: "硬件折腾", w: 92 },
        { label: "3D 打印", w: 86 },
        { label: "直播推流", w: 92 },
        { label: "内容运营", w: 92 },
      ],
    ],
    stack:
      "Python · Java · TypeScript · Vite · Docker · Linux · Blender · Pr / Ai / PS · DAW / VOCALOID · OBS · 软路由 · FDM / 光固化",
    footer: "Site: 8526.nl   ·   Email: shintokosei@qq.com",
  },
  en: {
    suffix: "-en",
    titleMain: "ShintoKosei",
    titleSub: "· 柠凉",
    titleSubX: 230,
    subtitle: "Student · Developer / Designer",
    bio1: "From coding to music production, 3D modeling to sysadmin—exploring dev, design, media, and hardware.",
    bio2: "Not a master of one, just aiming to make things work across every domain and turn ideas into reality.",
    domains: [
      [
        { label: "Full-Stack Dev", w: 122 },
        { label: "Visual Design", w: 112 },
        { label: "Music Prod", w: 100 },
        { label: "Video Editing", w: 112 },
        { label: "Networking", w: 102 },
        { label: "Self-Hosting", w: 106 },
      ],
      [
        { label: "Reverse Eng", w: 106 },
        { label: "Hardware", w: 94 },
        { label: "3D Printing", w: 102 },
        { label: "Live Streaming", w: 120 },
        { label: "Content Ops", w: 108 },
      ],
    ],
    stack:
      "Python · Java · TypeScript · Vite · Docker · Linux · Blender · Pr / Ai / PS · DAW / VOCALOID · OBS · OpenWrt · FDM / SLA",
    footer: "Website: 8526.nl   ·   Email: shintokosei@qq.com",
  },
};

function escapeXml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function readName(buf, wantedId) {
  const numTables = buf.readUInt16BE(4);
  let nameOffset = 0;
  for (let i = 0; i < numTables; i++) {
    const off = 12 + i * 16;
    if (buf.toString("ascii", off, off + 4) === "name") {
      nameOffset = buf.readUInt32BE(off + 8);
      break;
    }
  }
  if (!nameOffset) return null;
  const count = buf.readUInt16BE(nameOffset + 2);
  const stringOffset = buf.readUInt16BE(nameOffset + 4);
  for (let i = 0; i < count; i++) {
    const rec = nameOffset + 6 + i * 12;
    const platformID = buf.readUInt16BE(rec);
    const nameID = buf.readUInt16BE(rec + 6);
    const length = buf.readUInt16BE(rec + 8);
    const offset = buf.readUInt16BE(rec + 10);
    if (nameID === wantedId && platformID === 3) {
      const start = nameOffset + stringOffset + offset;
      const swapped = Buffer.from(buf.subarray(start, start + length));
      swapped.swap16();
      return swapped.toString("utf16le");
    }
  }
  return null;
}

function buildSvg(t, l) {
  const chips = [];
  l.domains.forEach((row, rIdx) => {
    let x = 40;
    const y = 232 + rIdx * 40;
    for (const item of row) {
      chips.push(
        `  <rect x="${x}" y="${y}" width="${item.w}" height="30" rx="11" fill="${t.primaryContainer}" />`,
        `  <text x="${x + item.w / 2}" y="${y + 20}" text-anchor="middle" font-size="13.5" fill="${t.onPrimaryContainer}">${escapeXml(item.label)}</text>`
      );
      x += item.w + 10;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${t.surfaceLow}" />
      <stop offset="100%" stop-color="${t.surfaceContainer}" />
    </linearGradient>
    <radialGradient id="roseGlow" cx="88%" cy="14%" r="52%">
      <stop offset="0%" stop-color="${t.primary}" stop-opacity="${t.glowOpacity}" />
      <stop offset="100%" stop-color="${t.primary}" stop-opacity="0" />
    </radialGradient>
    <clipPath id="cardClip">
      <rect x="2" y="2" width="${WIDTH - 4}" height="${HEIGHT - 4}" rx="26" />
    </clipPath>
  </defs>

  <g clip-path="url(#cardClip)">
    <rect x="2" y="2" width="${WIDTH - 4}" height="${HEIGHT - 4}" rx="26" fill="url(#bgGrad)" />
    <rect x="2" y="2" width="${WIDTH - 4}" height="${HEIGHT - 4}" rx="26" fill="url(#roseGlow)" />

    <!-- 鱼板装饰（与 8526.nl 主页一致） -->
    <g transform="translate(680 18) scale(1.25) rotate(-12 64 64)" opacity="${t.fishOpacity}">
      <path d="M64 12c6.2 0 10.1 4.4 15.6 5.9 5.5 1.5 11.2-.2 15.6 3.2 4.4 3.4 4.7 9.4 8.1 13.8 3.4 4.4 9.2 5.4 11.7 10.4 2.5 5-.2 10.6.8 16.1 1 5.5 5.4 9.7 5.2 15.3-.2 5.6-4.9 9.5-6.4 15-1.5 5.5.8 11.3-2.6 15.7-3.4 4.4-9.4 4.7-13.8 8.1-4.4 3.4-5.4 9.2-10.4 11.7-5 2.5-10.6-.2-16.1.8-5.5 1-9.7 5.4-15.3 5.2-5.6-.2-9.5-4.9-15-6.4-5.5-1.5-11.3.8-15.7-2.6-4.4-3.4-4.7-9.4-8.1-13.8-3.4-4.4-9.2-5.4-11.7-10.4-2.5-5 .2-10.6-.8-16.1-1-5.5-5.4-9.7-5.2-15.3.2-5.6 4.9-9.5 6.4-15 1.5-5.5-.8-11.3 2.6-15.7 3.4-4.4 9.4-4.7 13.8-8.1 4.4-3.4 5.4-9.2 10.4-11.7 5-2.5 10.6.2 16.1-.8C54.3 16.4 57.8 12 64 12z" fill="${t.fishOuter}" />
      <path d="M64 16c5.7 0 9.4 4.1 14.5 5.5 5.1 1.4 10.4-.2 14.5 3 4.1 3.2 4.4 8.7 7.5 12.8 3.2 4.1 8.5 5 10.9 9.7 2.3 4.6-.2 9.8.7 15 1 5.1 5 9 4.8 14.2-.2 5.2-4.5 8.8-5.9 13.9-1.4 5.1.7 10.5-2.4 14.6-3.2 4.1-8.7 4.4-12.8 7.5-4.1 3.2-5 8.5-9.7 10.9-4.6 2.3-9.8-.2-15 .7-5.1 1-9 5-14.2 4.8-5.2-.2-8.8-4.5-13.9-5.9-5.1-1.4-10.5.7-14.6-2.4-4.1-3.2-4.4-8.7-7.5-12.8-3.2-4.1-8.5-5-10.9-9.7-2.3-4.6.2-9.8-.7-15-1-5.1-5-9-4.8-14.2.2-5.2 4.5-8.8 5.9-13.9 1.4-5.1-.7-10.5 2.4-14.6 3.2-4.1 8.7-4.4 12.8-7.5 4.1-3.2 5-8.5 9.7-10.9 4.6-2.3 9.8.2 15-.7C55 20.1 58.3 16 64 16z" fill="${t.fishInner}" />
      <path d="M65.5 64.5c0-3.2-2.7-5.6-6-5.3-4.8.4-8.2 4.8-7.7 9.7.6 6.5 6.6 11.1 13.2 10.4 8.4-.9 14.3-8.6 13.3-17.1-1.2-10.4-10.8-17.8-21.3-16.5-12.5 1.5-21.3 13-19.7 25.6 1.7 13.8 14 23.8 27.9 22.9 12.1-.8 22.4-9.5 25.4-21" stroke="${t.fishSpiral}" stroke-width="7.5" stroke-linecap="round" fill="none" />
    </g>
  </g>

  <rect x="2" y="2" width="${WIDTH - 4}" height="${HEIGHT - 4}" rx="26" fill="none" stroke="${t.outlineVariant}" stroke-width="1.2" />

  <!-- 顶部标识 -->
  <rect x="40" y="34" width="94" height="26" rx="13" fill="${t.primaryContainer}" />
  <text x="87" y="51.5" text-anchor="middle" font-size="12.5" fill="${t.onPrimaryContainer}">8526.nl</text>

  <!-- 标题与角色 -->
  <text x="40" y="102" font-size="38" fill="${t.onSurface}">${escapeXml(l.titleMain)}</text>
  <text x="${l.titleSubX}" y="100" font-size="20" fill="${t.primary}">${escapeXml(l.titleSub)}</text>
  <text x="40" y="132" font-size="14.5" fill="${t.onSurfaceVariant}">${escapeXml(l.subtitle)}</text>

  <!-- 简洁介绍 -->
  <text x="40" y="166" font-size="14" fill="${t.onSurfaceVariant}">${escapeXml(l.bio1)}</text>
  <text x="40" y="189" font-size="14" fill="${t.onSurfaceVariant}">${escapeXml(l.bio2)}</text>

  <!-- 分割线 -->
  <line x1="40" y1="210" x2="800" y2="210" stroke="${t.outlineVariant}" stroke-width="1" opacity="0.65" />

  <!-- 领域胶囊 -->
${chips.join("\n")}

  <!-- 技术栈 -->
  <text x="40" y="334" font-size="12.5" fill="${t.primary}">${escapeXml(l.stack)}</text>

  <!-- 底部分割线与联系信息（仅网站与邮箱） -->
  <line x1="40" y1="358" x2="800" y2="358" stroke="${t.outlineVariant}" stroke-width="1" opacity="0.65" />
  <text x="40" y="387" font-size="13" fill="${t.onSurfaceVariant}">${escapeXml(l.footer)}</text>
</svg>
`;
}

const allSvgs = Object.values(LOCALES).map((l) => buildSvg(THEMES.light, l)).join("");
const allChars = Array.from(new Set(allSvgs.replace(/<[^>]+>/g, ""))).join("");

const ttf = await subsetFont(readFileSync(FONT_WOFF2), allChars, {
  targetFormat: "truetype",
});

const fontDir = path.join(os.tmpdir(), `gh-profile-font-${process.pid}`);
rmSync(fontDir, { recursive: true, force: true });
mkdirSync(fontDir, { recursive: true });
const ttfPath = path.join(fontDir, "custom-font.ttf");
writeFileSync(ttfPath, ttf);

const family = readName(ttf, 1);
if (!family) throw new Error("Failed to read CustomFont family name");

mkdirSync(OUT_DIR, { recursive: true });
for (const locale of Object.values(LOCALES)) {
  for (const [mode, theme] of Object.entries(THEMES)) {
    const svg = buildSvg(theme, locale);
    const resvg = new Resvg(svg, {
      font: {
        fontFiles: [ttfPath],
        loadSystemFonts: false,
        defaultFontFamily: family,
      },
      fitTo: { mode: "width", value: RENDER_WIDTH },
    });
    const outFile = path.join(OUT_DIR, `profile${locale.suffix}-${mode}.png`);
    writeFileSync(outFile, resvg.render().asPng());
  }
}

rmSync(fontDir, { recursive: true, force: true });
console.log("Rendered zh/en light/dark profile PNGs with font:", family);
