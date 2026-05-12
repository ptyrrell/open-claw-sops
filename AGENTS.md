# Agent guidance — open-claw-sops

This repo is the **Open Claw SOP playbook**. Static site, no server, no DB. SOPs are markdown-with-YAML-frontmatter files in `sops/`, rendered to HTML in `docs/` and served by GitHub Pages.

## When you're asked to add an SOP

1. Use the conversion prompt at `prompts/sop-from-transcript.md` — it defines the body section structure (When to use / Outcome / Prerequisites / Steps / Decision tree / FAQ / Definition of done / Related artefacts).
2. Frontmatter is required:
   - `title`, `slug` (kebab-case, must match filename), `owner`, `status` (`live` | `draft` | `archived`), `summary`, `source` (object with `type`, `url`, `label`), `tags` (array), `created`, `updated`. `related` is optional (array of other SOP slugs).
3. After writing the file, run `npm run build` to verify the site renders. Commit `sops/<slug>.md` AND the regenerated `docs/` (so GitHub Pages serves the latest without waiting on CI).
4. Bump `package.json` version on substantive changes (semver — patch for typo, minor for new SOP or template tweak, major for template/build breaking changes).

## When you're asked to edit an existing SOP

- Update the body in `sops/<slug>.md`, bump `updated:` in frontmatter to today's date, run `npm run build`, commit both the markdown and the regenerated HTML.

## Constraints

- **Do not deprecate or delete SOPs without explicit confirmation.** Mark `status: archived` instead — the build still renders them but they sort to the bottom and get a muted card.
- **No JS frameworks.** This is plain HTML/CSS by design. The only JS is in `templates/index.html` for client-side search/filter.
- **Don't change the template structure without checking how SOPs render.** A schema break silently produces missing fields.
- **Match the dark theme palette.** Variables in `docs/styles.css` `:root` — use those, don't hardcode hex values.

## Common operations

- Add SOP: write `sops/foo.md` → `npm run build` → commit `sops/foo.md` + `docs/`
- Edit SOP: edit `sops/foo.md`, bump `updated:`, `npm run build`, commit
- Tweak template: edit `templates/sop.html` or `templates/_layout.html`, `npm run build`, eyeball every SOP page (check `docs/sops/*.html`), commit
- Tweak styles: edit `docs/styles.css` directly (it's not generated), commit. No build needed for CSS.

## Linked systems

- **Alfred** (`~/Alfred/alfred/tools/sops.py`) calls into this repo via local clone at `~/Code/open-claw-sops/` to write + commit + push new SOPs from SMS triggers.
- **GitHub Pages** serves `docs/` from the `main` branch.
- Site URL: `https://ptyrrell.github.io/open-claw-sops/`
