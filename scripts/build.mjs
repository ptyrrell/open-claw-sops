#!/usr/bin/env node
// Build script for open-claw-sops.
// Reads sops/*.md (markdown + YAML frontmatter), renders each through
// templates/sop.html wrapped in templates/_layout.html, and writes to docs/.
// Also generates docs/index.html (searchable, tag-filterable list of all SOPs).

import { readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, basename, extname } from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT      = dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, '');
const SOPS_DIR  = join(ROOT, 'sops');
const TPL_DIR   = join(ROOT, 'templates');
const OUT_DIR   = join(ROOT, 'docs');
const OUT_SOPS  = join(OUT_DIR, 'sops');

const pkg       = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
const VERSION   = pkg.version;
const BUILT_AT  = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

marked.setOptions({ breaks: false, gfm: true });

const layout    = await readFile(join(TPL_DIR, '_layout.html'), 'utf8');
const sopTpl    = await readFile(join(TPL_DIR, 'sop.html'),     'utf8');
const indexTpl  = await readFile(join(TPL_DIR, 'index.html'),   'utf8');

function fillTemplate(tpl, vars) {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v == null ? '' : String(v));
  }
  return out;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function tagsHtml(tags) {
  if (!tags || !tags.length) return '';
  return tags.map(t => `<span class="sop-card-tag">${escapeHtml(t)}</span>`).join('');
}

function sourceHtml(source) {
  if (!source) return '<em>—</em>';
  if (typeof source === 'string') {
    if (source.startsWith('http')) return `<a href="${escapeHtml(source)}" target="_blank" rel="noopener">${escapeHtml(source)}</a>`;
    return escapeHtml(source);
  }
  // structured: { type: "loom" | "fathom" | "zoom" | "manual", url, label }
  const label = source.label || source.url || source.type || 'source';
  const type  = source.type ? `<span class="sop-card-tag">${escapeHtml(source.type)}</span> ` : '';
  if (source.url) return `${type}<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
  return `${type}${escapeHtml(label)}`;
}

function extraFrontmatterHtml(fm) {
  const known = new Set(['title','slug','owner','status','source','tags','created','updated','summary','related']);
  const extra = [];
  for (const [k, v] of Object.entries(fm)) {
    if (known.has(k)) continue;
    if (v == null) continue;
    extra.push(`<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(typeof v === 'object' ? JSON.stringify(v) : v)}</dd>`);
  }
  if (fm.related && Array.isArray(fm.related) && fm.related.length) {
    const links = fm.related.map(s => `<a href="/open-claw-sops/sops/${escapeHtml(s)}.html">${escapeHtml(s)}</a>`).join(', ');
    extra.unshift(`<dt>Related</dt><dd>${links}</dd>`);
  }
  return extra.join('\n    ');
}

async function buildSop(file) {
  const raw = await readFile(join(SOPS_DIR, file), 'utf8');
  const { data: fm, content: md } = matter(raw);
  const slug = fm.slug || basename(file, '.md');
  const bodyHtml = marked.parse(md);

  const sopHtml = fillTemplate(sopTpl, {
    SLUG: slug,
    TITLE: escapeHtml(fm.title || slug),
    SUMMARY: escapeHtml(fm.summary || ''),
    OWNER: escapeHtml(fm.owner || 'Paul Tyrrell'),
    STATUS: escapeHtml(fm.status || 'draft'),
    SOURCE_HTML: sourceHtml(fm.source),
    CREATED: escapeHtml(fm.created instanceof Date ? fm.created.toISOString().slice(0,10) : (fm.created || '')),
    UPDATED: escapeHtml(fm.updated instanceof Date ? fm.updated.toISOString().slice(0,10) : (fm.updated || (fm.created instanceof Date ? fm.created.toISOString().slice(0,10) : (fm.created || '')))),
    TAGS_HTML: tagsHtml(fm.tags || []),
    EXTRA_FRONTMATTER_HTML: extraFrontmatterHtml(fm),
    BODY_HTML: bodyHtml,
  });

  const page = fillTemplate(layout, {
    VERSION, BUILT_AT,
    TITLE: escapeHtml(fm.title || slug),
    CONTENT: sopHtml,
  });

  await mkdir(OUT_SOPS, { recursive: true });
  await writeFile(join(OUT_SOPS, `${slug}.html`), page, 'utf8');

  const toStr = v => v == null ? '' : (v instanceof Date ? v.toISOString().slice(0,10) : String(v));
  return {
    slug,
    title: fm.title || slug,
    summary: fm.summary || '',
    owner: fm.owner || 'Paul Tyrrell',
    status: fm.status || 'draft',
    tags: fm.tags || [],
    created: toStr(fm.created),
    updated: toStr(fm.updated || fm.created),
    file,
  };
}

function sopCard(s) {
  const haystack = [s.title, s.summary, s.owner, ...(s.tags || [])].join(' ').toLowerCase();
  const tagsAttr = (s.tags || []).join(',');
  const meta = [
    `<span>${escapeHtml(s.owner)}</span>`,
    `<span class="dot"></span>`,
    `<span class="status status-${escapeHtml(s.status)}">${escapeHtml(s.status)}</span>`,
    `<span class="dot"></span>`,
    `<span>updated ${escapeHtml(s.updated || s.created || '—')}</span>`,
  ].join(' ');
  const tagPills = (s.tags || []).map(t => `<span class="sop-card-tag">${escapeHtml(t)}</span>`).join(' ');
  return `<li data-haystack="${escapeHtml(haystack)}" data-tags="${escapeHtml(tagsAttr)}">
  <a class="sop-card" href="/open-claw-sops/sops/${escapeHtml(s.slug)}.html">
    <div class="sop-card-title">${escapeHtml(s.title)}</div>
    ${s.summary ? `<div class="sop-card-summary">${escapeHtml(s.summary)}</div>` : ''}
    <div class="sop-card-meta">${meta} ${tagPills}</div>
  </a>
</li>`;
}

async function buildIndex(allSops) {
  // Sort: live first, then by updated desc, then created desc
  const sorted = [...allSops].sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === 'live') return -1;
      if (b.status === 'live') return 1;
    }
    return String(b.updated || b.created || '').localeCompare(String(a.updated || a.created || ''));
  });
  const tagSet = new Set();
  allSops.forEach(s => (s.tags || []).forEach(t => tagSet.add(t)));
  const tagButtons = [...tagSet].sort().map(t => `<button class="tag-btn" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join('');

  const indexHtml = fillTemplate(indexTpl, {
    TOTAL: allSops.length,
    LIVE_COUNT:  allSops.filter(s => s.status === 'live').length,
    DRAFT_COUNT: allSops.filter(s => s.status === 'draft').length,
    TAG_BUTTONS_HTML: tagButtons,
    SOP_CARDS_HTML: sorted.map(sopCard).join('\n'),
  });
  const page = fillTemplate(layout, {
    VERSION, BUILT_AT,
    TITLE: 'All SOPs',
    CONTENT: indexHtml,
  });
  await writeFile(join(OUT_DIR, 'index.html'), page, 'utf8');
}

async function main() {
  if (!existsSync(SOPS_DIR)) {
    console.error('No sops/ directory found.');
    process.exit(1);
  }
  await mkdir(OUT_DIR, { recursive: true });
  const files = (await readdir(SOPS_DIR)).filter(f => f.endsWith('.md') && !f.startsWith('_'));
  if (files.length === 0) {
    console.warn('No SOPs found in sops/. Building empty index.');
  }
  console.log(`Building ${files.length} SOPs → docs/`);
  const sops = [];
  for (const f of files) {
    try {
      const s = await buildSop(f);
      sops.push(s);
      console.log(`  ✓ ${f.padEnd(50)} → docs/sops/${s.slug}.html  [${s.status}]`);
    } catch (e) {
      console.error(`  ✗ ${f}: ${e.message}`);
      process.exitCode = 1;
    }
  }
  await buildIndex(sops);
  console.log(`✓ Built docs/index.html  (${sops.length} SOPs · v${VERSION})`);
}

main().catch(e => { console.error(e); process.exit(1); });
