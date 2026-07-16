**Source visual truth**

- `/var/folders/10/4skq382x49d1k8gvrx1cxr200000gn/T/codex-clipboard-16ff2091-742b-471b-b684-2a60b16037d6.png`
- `/var/folders/10/4skq382x49d1k8gvrx1cxr200000gn/T/codex-clipboard-299ed434-7ff4-40db-ad80-8e91a6bab589.png`

**Implementation evidence**

- `/Users/wkl/Documents/个人网站/test-results/card-titles-no-underlines.png`
- Viewport: 1280 × 900; full-page capture.
- State: Chinese homepage, default project and post card state.
- Primary interaction checked: all four card title links remain present and clickable; existing focus styling is unchanged.
- Console errors: none observed during the local visual check.

**Full-view comparison evidence**

- The local homepage rendered without horizontal overflow at 1280 × 900.

**Focused region comparison evidence**

- Both source screenshots and the local full-page capture were inspected together.
- The two project titles and two post titles retain their content, spacing, hierarchy, and clickable area. The requested underline is absent from all four local card title links.
- The sources are scaled crops, so apparent font size is not used as a fidelity target; typography, colors, spacing, assets, and copy were intentionally left unchanged by this scoped edit.

**Findings**

- No actionable P0, P1, or P2 differences remain within the requested underline-removal scope.
- Fonts and typography: unchanged except for removal of link decoration.
- Spacing and layout rhythm: unchanged; no horizontal overflow.
- Colors and visual tokens: unchanged.
- Image quality and asset fidelity: no image assets are involved.
- Copy and content: unchanged.

**Comparison history**

- Initial automated check received `text-decoration-line: underline` for the card title link.
- Added the scoped card-heading rule, then captured the revised local homepage; all four project and post title links report `text-decoration-line: none`.

**Implementation Checklist**

- [x] Remove project and post card title underlines only.
- [x] Preserve title content, link targets, card layout, and focus visibility.
- [x] Verify the full desktop layout and targeted computed styles.

final result: passed
