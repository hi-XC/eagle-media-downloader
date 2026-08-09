# Design QA

## Evidence

- Source visual truth: Figma file `yvxFdoqRgQOntLMugs4kMU`, board node `3:2`; local capture `audit/figma-ui-concept-latest.png`.
- Implementation captures: `audit/04-idle.png`, `audit/05-fetching.png`, `audit/06-downloading.png`, `audit/07-completed.png`, and `audit/08-settings.png`.
- Full comparison: `audit/09-figma-vs-implementation.png`.
- Viewport: 400 x 300 CSS pixels for every implementation state.
- Density: source screen frames and implementation captures were both evaluated at 1 CSS pixel to 1 image pixel. The 2176 x 466 Figma board capture contains five 400 x 300 frames plus board labels and spacing.
- States: idle, fetching metadata, downloading a carousel, completed list, and settings.

## Findings

- No actionable P0, P1, or P2 visual differences remain.
- Typography: the implementation uses the same Inter/system fallback strategy, weights, sizes, and compact hierarchy visible in the Figma source. Text remains single-line and does not clip at 400 px.
- Spacing and layout: header, 12 px outer margins, 34 px input, 72 px active task rows, 42 px completed rows, 8 px radii, and settings-group rhythm match the source.
- Colors and tokens: window, control, panel, secondary text, progress, success, and divider colors map to the source palette with sufficient contrast.
- Image and icon fidelity: the updated Figma `App icon` is used for `assets/logo.png`; interface icons are SVG assets rather than text glyphs or CSS drawings.
- Copy: visible English copy matches the Figma states. Chinese equivalents remain concise and localized.

## Comparison History

- Initial capture normalization: headless Chrome imposed a wider layout viewport while exporting a 400 px image, which cropped right-side controls. The preview harness now fixes the document to 400 px before capture. This was a capture issue, not an application layout issue.
- Final polish: restored the disabled ffmpeg overflow icon shown in the source, shortened the indeterminate progress segment, and inset completed-row dividers after the status icon.
- Post-fix evidence: `audit/09-figma-vs-implementation.png`.

## Focused Checks

- Downloading progress: `audit/06-downloading.png` confirms one overall progress bar plus `Item 5/12 · 50% · speed` detail.
- Completed rows: `audit/07-completed.png` confirms compact rows, inset dividers, counts, and conditional Clear action.
- Settings: `audit/08-settings.png` confirms the single back-title header, dependency grouping, status alignment, overflow controls, and advanced source selector.

## Interaction And Runtime Checks

- `npm test`: 7 tests passed.
- `npm run build`: passed.
- Package archive integrity: passed with all new assets and stylesheet included.
- The package opened in Eagle and the updated icon appeared in Eagle's plugin list.
- A full automated click-through inside Eagle was not possible because macOS requested Accessibility permission for host-app control. The rendered states and production JavaScript build were checked separately.

## Follow-up Polish

- None required for this iteration.

final result: passed
