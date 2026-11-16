#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const W = 1000;
const warnings = [];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textW(s, size) {
  return String(s).length * size * 0.53;
}

function warnFit(where, text, size, room) {
  if (textW(text, size) > room) {
    warnings.push(`${where}: "${text}" is about ${Math.round(textW(text, size))}px in ${Math.round(room)}px; shorten it`);
  }
}

const MARKERS = `<defs>
<marker id="ID-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path class="mk" d="M0 0 L10 5 L0 10 z"/></marker>
<marker id="ID-head-sm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="mk" d="M0 0 L10 5 L0 10 z"/></marker>
<marker id="ID-head-acc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path class="mk-accent" d="M0 0 L10 5 L0 10 z"/></marker>
</defs>`;

function markers(id) {
  return MARKERS.replace(/ID-/g, `${id}-`);
}

function edgeClass(kind) {
  if (kind === "bytes") {
    return "wire acc";
  }
  if (kind === "event") {
    return "wire dash";
  }
  return "wire";
}

function headFor(id, kind, small) {
  if (kind === "bytes") {
    return `url(#${id}-head-acc)`;
  }
  return small ? `url(#${id}-head-sm)` : `url(#${id}-head)`;
}

function renderTiers(d, id) {
  const sideW = d.side ? 140 : 0;
  const bandX = 16 + sideW + (d.side ? 20 : 0);
  const bandW = W - 16 - bandX;
  const nodeH = (n) => 40 + (n.sub || []).length * 18 + (n.parts ? 54 : 0);
  const nodes = {};
  const tierBox = [];
  let y = 14;
  const gap = 44;
  d.tiers.forEach((t, ti) => {
    const inner = Math.max(...t.nodes.map(nodeH));
    const h = 44 + inner + 18;
    tierBox.push({ y, h, name: t.name });
    const room = bandW - 40;
    const fixed = t.nodes.filter((n) => n.w).reduce((a, n) => a + n.w, 0);
    const free = t.nodes.filter((n) => !n.w).length;
    const gaps = (t.nodes.length - 1) * 30;
    const autoW = free ? (room - fixed - gaps) / free : 0;
    let x = bandX + 20;
    t.nodes.forEach((n) => {
      const w = n.w || autoW;
      const nx = n.x != null ? n.x : x;
      nodes[n.id] = { ...n, x: nx, y: y + 40, w, h: inner, tier: ti };
      x = nx + w + 30;
    });
    y += h + gap;
  });
  if (d.side) {
    const t = tierBox[d.side.tier];
    const n = d.side.node;
    const h = nodeH(n);
    nodes[n.id] = { ...n, x: 16, y: t.y + 40 + (t.h - 58 - h) / 2, w: sideW, h, tier: d.side.tier, side: true };
  }
  const H = y - gap + 14;
  const out = [];
  for (const t of tierBox) {
    out.push(`<rect class="band" x="${bandX}" y="${t.y}" width="${bandW}" height="${t.h}" rx="10"/>`);
    out.push(`<text class="tier" x="${bandX + 16}" y="${t.y + 24}">${esc(t.name.toUpperCase())}</text>`);
  }
  for (const n of Object.values(nodes)) {
    const tone = n.tone ? `z-${n.tone}` : "n";
    out.push(`<rect class="${tone}" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="8"/>`);
    const cx = n.x + n.w / 2;
    const lines = 1 + (n.sub || []).length;
    let ty = n.y + (n.parts ? 22 : n.h / 2 - (lines - 1) * 9 + 5);
    out.push(`<text class="nt" x="${cx}" y="${ty}" text-anchor="middle">${esc(n.title)}</text>`);
    warnFit(`node ${n.id}`, n.title, 15, n.w - 16);
    for (const s of n.sub || []) {
      ty += 19;
      const it = s.startsWith("~") ? ` font-style="italic"` : "";
      const txt = s.replace(/^~/, "");
      out.push(`<text class="ns" x="${cx}" y="${ty}" text-anchor="middle"${it}>${esc(txt)}</text>`);
      warnFit(`node ${n.id}`, txt, 12.5, n.w - 12);
    }
    if (n.parts) {
      const pw = (n.w - 24 - (n.parts.length - 1) * 10) / n.parts.length;
      n.parts.forEach((p, i) => {
        const px = n.x + 12 + i * (pw + 10);
        const py = n.y + n.h - 58;
        out.push(`<rect class="z-${p.tone || "info"}" x="${px}" y="${py}" width="${pw}" height="44" rx="6"/>`);
        out.push(`<text class="ns tone-${p.tone || "info"}" x="${px + pw / 2}" y="${py + 27}" text-anchor="middle">${esc(p.text)}</text>`);
      });
    }
  }
  const used = new Set();
  const gapRuns = {};
  for (const e of d.edges) {
    used.add(e.kind || "call");
    const a = nodes[e.from];
    const b = nodes[e.to];
    if (!a || !b) {
      warnings.push(`edge ${e.from} → ${e.to}: unknown node`);
      continue;
    }
    const cls = edgeClass(e.kind);
    const head = headFor(id, e.kind);
    const ends = e.both ? `marker-start="${head}" marker-end="${head}"` : `marker-end="${head}"`;
    let pathD;
    let lx;
    let ly;
    let anchor = "start";
    if (a.tier === b.tier && e.above) {
      const ax = a.x + a.w / 2 + (e.offset || 0);
      const bx = b.x + b.w / 2;
      const ty = Math.min(a.y, b.y) - 12;
      pathD = `M${ax} ${a.y} V${ty} H${bx} V${b.y - 4}`;
      lx = (ax + bx) / 2;
      ly = ty - 5;
      anchor = "middle";
    } else if (a.tier === b.tier) {
      const left = a.x < b.x ? a : b;
      const right = a.x < b.x ? b : a;
      const yy = Math.max(a.y, b.y) + Math.min(a.h, b.h) / 2 + (e.offset || 0);
      const x1 = a === left ? left.x + left.w + 4 : right.x - 4;
      const x2 = a === left ? right.x - 4 : left.x + left.w + 4;
      pathD = `M${x1} ${yy} H${x2}`;
      lx = (x1 + x2) / 2;
      ly = yy - 8;
      anchor = "middle";
    } else {
      const down = b.tier > a.tier;
      const y1 = down ? a.y + a.h : a.y;
      const y2 = down ? b.y - 4 : b.y + b.h + 4;
      const lo = Math.max(a.x, b.x) + 14;
      const hi = Math.min(a.x + a.w, b.x + b.w) - 14;
      const blockers = Object.values(nodes).filter((n) => n.tier > Math.min(a.tier, b.tier) && n.tier < Math.max(a.tier, b.tier));
      let x = null;
      if (e.x != null) {
        x = e.x;
      } else if (hi >= lo) {
        const cands = [];
        for (let c = lo; c <= hi; c += 2) {
          if (!blockers.some((n) => c > n.x - 8 && c < n.x + n.w + 8)) {
            cands.push(c);
          }
        }
        if (cands.length) {
          const mid = (lo + hi) / 2 + (e.offset || 0);
          x = cands.reduce((p, c) => (Math.abs(c - mid) < Math.abs(p - mid) ? c : p));
        }
      }
      if (x != null) {
        pathD = `M${x} ${y1} V${y2}`;
        lx = x + 8;
        const gi = down ? a.tier : a.tier - 1;
        ly = tierBox[gi].y + tierBox[gi].h + gap / 2 + 5;
      } else {
        const gi = down ? a.tier : a.tier - 1;
        gapRuns[gi] = (gapRuns[gi] || 0) + 1;
        const gy = tierBox[gi].y + tierBox[gi].h + 12 + (gapRuns[gi] - 1) * 10;
        const x1 = a.x + a.w / 2 + (e.offset || 0);
        const x2 = e.toX != null ? e.toX : b.x + b.w / 2 + (e.offset || 0);
        pathD = `M${x1} ${y1} V${gy} H${x2} V${y2}`;
        lx = (x1 + x2) / 2;
        ly = gy - 5;
        anchor = "middle";
      }
    }
    if (e.label) {
      if (e.labelAt) {
        lx = e.labelAt[0];
        ly = e.labelAt[1];
        anchor = e.labelAnchor || "start";
      }
      const lc = e.kind === "bytes" ? "wl acc" : "wl";
      out.push(`<text class="${lc}" x="${lx}" y="${ly}" text-anchor="${anchor}">${esc(e.label)}</text>`);
    }
    out.push(`<path class="${cls}" d="${pathD}" ${ends}/>`);
  }
  const svg = `<svg class="diagram cd" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(d.alt || "Component diagram")}" xmlns="http://www.w3.org/2000/svg">
${markers(id)}
${out.join("\n")}
</svg>`;
  return { svg, used };
}

function renderSteps(d, id) {
  const cols = d.columns;
  const handler = cols.find((c) => c.handler);
  const others = cols.filter((c) => !c.handler);
  const hw = d.handlerWidth || 400;
  const gapX = 34;
  const ow = (W - 32 - hw - gapX * (cols.length - 1)) / others.length;
  let x = 16;
  const C = {};
  for (const c of cols) {
    const w = c.handler ? hw : ow;
    C[c.id] = { ...c, x, w };
    x += w + gapX;
  }
  const H0 = C[handler.id];
  const boxL = H0.x + 14;
  const boxR = H0.x + H0.w - 14;
  const right = (cid) => C[cid].x + C[cid].w;
  const out = [];
  const used = new Set();
  let y = cols.some((c) => c.sub) ? 88 : 66;
  const arrowRow = (from, to, label, kind, yy) => {
    used.add(kind || "call");
    const a = C[from];
    const b = C[to];
    const ltr = a.x < b.x;
    const x1 = ltr ? right(from) : a.x;
    const x2 = ltr ? b.x - 6 : right(to) + 6;
    const cls = kind === "bytes" ? "fl-req acc" : kind === "event" || kind === "reply" ? "fl-req dash" : "fl-req";
    out.push(`<line class="${cls}" x1="${x1}" y1="${yy}" x2="${x2}" y2="${yy}" marker-end="${headFor(id, kind)}"/>`);
    const lc = kind === "bytes" ? "fl-lbl acc" : kind === "call" || !kind ? "fl-lbl strong" : "fl-lbl";
    const lx = Math.min(x1, x2) + 12;
    out.push(`<text class="${lc}" x="${lx}" y="${yy - 9}">${esc(label)}</text>`);
  };
  d.steps.forEach((s, i) => {
    y += 14;
    out.push(`<circle class="fl-num" cx="34" cy="${y}" r="14"/>`);
    out.push(`<text class="fl-num-t" x="34" y="${y + 5}" text-anchor="middle">${i + 1}</text>`);
    out.push(`<text class="fl-step" x="58" y="${y + 6}">${esc(s.title)}</text>`);
    y += 44;
    if (s.side) {
      const sc = C[s.side.col];
      out.push(`<text class="fl-side" x="${sc.x + 12}" y="${y + 26}">${esc(s.side.text)}</text>`);
    }
    if (s.call) {
      arrowRow(s.call.from, handler.id, s.call.label, "call", y);
      y += 12;
    }
    for (const r of s.rows || []) {
      arrowRow(r.from, r.to, r.label, r.kind, y);
      if (r.idle) {
        const ic = C[r.idle];
        out.push(`<text class="fl-side" x="${ic.x + ic.w / 2}" y="${y + 26}" text-anchor="middle">${esc("not involved")}</text>`);
      }
      y += 48;
    }
    if ((s.rows || []).length) {
      y -= 22;
    }
    if (s.box && !s.call && !(s.rows || []).length) {
      y -= 24;
    }
    if (s.box) {
      const top = y;
      const lines = s.box.lines || [];
      const h = 36 + lines.length * 30;
      out.push(`<rect class="fl-box" x="${boxL}" y="${top}" width="${boxR - boxL}" height="${h}" rx="8"/>`);
      out.push(`<text class="fl-box-t" x="${boxL + 14}" y="${top + 22}">${esc(s.box.title)}</text>`);
      let indent = 14;
      lines.forEach((ln, j) => {
        const ly = top + 52 + j * 30;
        if (ln.kind === "cond") {
          out.push(`<text class="fl-line pr-cond" x="${boxL + 14}" y="${ly}">${esc(ln.text)}</text>`);
          indent = 30;
          return;
        }
        out.push(`<text class="fl-line" x="${boxL + indent}" y="${ly}">${esc(ln.text)}</text>`);
        warnFit(`step ${i + 1} box line`, ln.text, 14.5, boxR - boxL - indent - 10);
        if (!ln.to) {
          return;
        }
        used.add(ln.kind === "event" ? "event" : "sub");
        const ay = ly - 5;
        const t = C[ln.to];
        const lcls = ln.kind === "event" ? "fl-sub pr-dash" : "fl-sub";
        const ends = ln.kind === "event" ? `marker-end="${headFor(id, "call", true)}"` : `marker-start="${headFor(id, "call", true)}" marker-end="${headFor(id, "call", true)}"`;
        if (t.x < H0.x) {
          out.push(`<line class="${lcls}" x1="${boxL}" y1="${ay}" x2="${right(ln.to) - 4}" y2="${ay}" ${ends}/>`);
        } else {
          out.push(`<line class="${lcls}" x1="${boxR}" y1="${ay}" x2="${t.x + 4}" y2="${ay}" ${ends}/>`);
        }
        if (ln.note) {
          out.push(`<text class="pr-side" x="${t.x + 10}" y="${ly - 12}">${esc(ln.note)}</text>`);
          warnFit(`step ${i + 1} note in ${ln.to}`, ln.note, 13, t.w - 14);
        }
      });
      y = top + h;
    }
    if (s.reply) {
      y += 30;
      arrowRow(handler.id, s.reply.to, s.reply.label, "reply", y);
    }
    y += 22;
    for (const n of s.notes || []) {
      y += 22;
      out.push(`<text class="fl-note" x="58" y="${y}">${esc(n)}</text>`);
      warnFit(`step ${i + 1} note`, n, 14, W - 80);
    }
    y += 18;
    if (i < d.steps.length - 1) {
      out.push(`<line class="fl-rule" x1="16" y1="${y}" x2="${W - 16}" y2="${y}"/>`);
    }
  });
  const H = y + 10;
  const head = [];
  for (const c of Object.values(C)) {
    head.push(`<rect class="fl-col" x="${c.x}" y="12" width="${c.w}" height="${H - 24}" rx="10"/>`);
    head.push(`<text class="fl-col-t" x="${c.x + c.w / 2}" y="42" text-anchor="middle">${esc(c.name)}</text>`);
    if (c.sub) {
      head.push(`<text class="pr-sub" x="${c.x + c.w / 2}" y="62" text-anchor="middle">${esc(c.sub)}</text>`);
    }
  }
  const svg = `<svg class="diagram fl" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(d.alt || "Flow diagram")}" xmlns="http://www.w3.org/2000/svg">
${markers(id)}
${head.join("\n")}
${out.join("\n")}
</svg>`;
  return { svg, used };
}

const LEGEND = {
  call: `<span><i class="sw"></i>request or call</span>`,
  reply: `<span><i class="sw dash"></i>reply</span>`,
  event: `<span><i class="sw dash"></i>event</span>`,
  bytes: `<span><i class="sw acc"></i>file bytes</span>`,
  sub: `<span><i class="sw thin"></i>call made inside the box, and its answer</span>`,
};

function legend(used) {
  const order = ["call", "reply", "event", "bytes", "sub"];
  return `<div class="legend">${order.filter((k) => used.has(k)).map((k) => LEGEND[k]).join("\n")}</div>`;
}

function renderSection(s, i) {
  let body = s.html || "";
  if (s.diagram) {
    const id = `d${i}`;
    const r = s.diagram.type === "tiers" ? renderTiers(s.diagram, id) : renderSteps(s.diagram, id);
    body = `<figure>
<div class="diagram-box">
${r.svg}
</div>
${legend(r.used)}
${s.caption ? `<figcaption>${s.caption}</figcaption>` : ""}
</figure>
${s.html || ""}`;
  }
  const qn = s.qn ? `<span class="qn">${esc(s.qn)}</span>` : "";
  return `<section id="${esc(s.id)}">
<h2>${qn}${s.h2}</h2>
${body}
</section>`;
}

function main() {
  const [specPath, outPath] = process.argv.slice(2);
  if (!specPath || !outPath) {
    console.error("usage: node render.cjs <spec.json> <out.html>");
    process.exit(2);
  }
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const tpl = fs.readFileSync(path.join(__dirname, "..", "template.html"), "utf8");
  const sections = spec.sections.map((s, i) => {
    const html = renderSection(s, i);
    return s.ruleBefore ? `<hr>\n${html}` : html;
  });
  const html = tpl
    .replace(/\{\{TITLE\}\}/g, esc(spec.title))
    .replace("{{EYEBROW}}", esc(spec.eyebrow || "System design"))
    .replace("{{LEDE}}", spec.lede || "")
    .replace("{{SECTIONS}}", sections.join("\n\n"))
    .replace("{{FOOTER}}", spec.footer ? `<footer>${spec.footer}</footer>` : "");
  fs.writeFileSync(outPath, html);
  console.log(`wrote ${outPath} (${html.length} bytes, ${spec.sections.length} sections)`);
  for (const w of warnings) {
    console.log(`warn: ${w}`);
  }
}

main();
