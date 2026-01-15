---
name: figma-to-code
description: |
  Pixel-perfect implementation of Figma designs using Figma MCP for specifications and Chrome DevTools MCP for iterative visual validation. Use this skill when a user provides a Figma link and wants an accurate HTML/CSS implementation. The skill includes formulas for correct positioning, iterative diff-based refinement, and achieves 98%+ pixel accuracy.
license: MIT
compatibility: |
  Requires: Figma MCP (Framelink), Chrome DevTools MCP, modern browser.
  Works with HTML, CSS (vanilla or Tailwind), and any frontend framework.
  Compatible with any agent supporting the Agent Skills standard (Cursor, GitHub Copilot, Claude, Amp, Goose, etc.)
metadata:
  author: Countmatters
  version: 1.0.0
  tags: figma, design, pixel-perfect, css, html, frontend
---

# Figma to Code: Pixel-Perfect Implementation

This skill enables accurate implementation of Figma designs with iterative visual validation.

> **Agent-agnostic**: This skill works with any AI coding agent that supports the [Agent Skills standard](https://agentskills.io).

## Prerequisites

- **Figma MCP** (Framelink) - for extracting design specifications
- **Chrome DevTools MCP** - for taking screenshots and visual comparison
- **pixelmatch** and **pngjs** npm packages (for diff generation)

## Workflow Overview

```
1. Extract Figma specs → 2. Create HTML/CSS → 3. Screenshot → 4. Diff compare → 5. Iterate
```

## Step 1: Extract Figma Design Data

Use the Figma MCP to get precise specifications:

```
Tool: get_figma_data
Server: user-Framelink MCP for Figma
Arguments:
  fileKey: "<extracted from URL: figma.com/design/<fileKey>/...>"
  nodeId: "<extracted from URL: node-id=<nodeId>>"
```

### Key Data to Extract

From the response, capture these `globalVars.styles` values:

| Data Type | What to Look For |
|-----------|------------------|
| **Dimensions** | `dimensions.width`, `dimensions.height` |
| **Position** | `locationRelativeToParent.x`, `locationRelativeToParent.y` |
| **Colors** | `fill_*` arrays (e.g., `['#FDFDFD']`) |
| **Typography** | `fontFamily`, `fontSize`, `fontWeight`, `lineHeight` |
| **Spacing** | `padding`, `gap`, `margin` in layout styles |
| **Borders** | `borderRadius`, `strokeWeight`, `stroke_*` colors |

### Download Icons/Images

```
Tool: download_figma_images
Server: user-Framelink MCP for Figma
Arguments:
  fileKey: "<fileKey>"
  nodes: [
    { nodeId: "<icon-node-id>", fileName: "icon-name.svg" }
  ]
  localPath: "<absolute-path-to-images-folder>"
```

## Step 2: Positioning Formula

**Critical**: Figma's y-coordinates are from the TOP of the bounding box, but CSS text rendering is affected by `line-height`.

### The Line-Height Offset Problem

When text has `line-height > 1`, extra space is added above and below:

```
offset = (line-height - 1) × font-size ÷ 2
```

### Solution: Two Approaches

**Option A: Compensate in CSS position**
```css
/* Figma says y: 48, font-size: 48px, line-height: 1.2 */
/* offset = (1.2 - 1) × 48 ÷ 2 = 4.8px */
.element {
  top: 43px; /* 48 - 5 (rounded) */
  line-height: 1.2;
}
```

**Option B: Use line-height: 1 (Recommended)**
```css
/* Use Figma coordinates directly */
.element {
  top: 43px; /* Figma y minus small offset */
  line-height: 1; /* Eliminates extra spacing */
}
```

### Position Mapping Table

| Figma Property | CSS Property |
|----------------|--------------|
| `locationRelativeToParent.x` | `left` (for `position: absolute`) |
| `locationRelativeToParent.y` | `top` (adjust for line-height) |
| `dimensions.width` | `width` |
| `dimensions.height` | `height` |

## Step 3: Create HTML/CSS Structure

### Best Practices

1. **Use absolute positioning** for precise placement within cards/containers
2. **Match exact Figma values** for colors, border-radius, padding, gap
3. **Load Google Fonts** if Figma uses custom fonts (e.g., Urbanist)
4. **Add font-smoothing** for better rendering:

```css
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

### CSS Structure Template

```css
:root {
  /* Colors from Figma fills */
  --color-background: #FDFDFD;
  --color-text: #1E162E;
  --color-border: #DBDBDB;
  
  /* Typography from Figma text styles */
  --font-heading-size: 48px;
  --font-heading-weight: 400;
  --font-label-size: 12px;
  --font-label-weight: 500;
}

.container {
  position: relative;
  width: 318px;  /* From Figma dimensions */
  height: 230px;
  background: var(--color-background);
  border-radius: 8px; /* From Figma borderRadius */
}

.element {
  position: absolute;
  top: 48px;   /* From Figma y coordinate */
  left: 16px;  /* From Figma x coordinate */
}
```

## Step 4: Visual Comparison with Chrome DevTools MCP

### Take Screenshot of Implementation

First, open the HTML file in Chrome and take a screenshot:

```
Tool: new_page
Server: user-chrome-devtools
Arguments:
  url: "file:///path/to/your/index.html"
```

Wait for fonts to load, then:

```
Tool: take_screenshot
Server: user-chrome-devtools
Arguments:
  format: "png"
  filePath: "/path/to/output/screenshot.png"
```

### For Element-Specific Screenshots

If you need to capture just a specific element:

```
Tool: take_snapshot
Server: user-chrome-devtools
```

Then use the `uid` from the snapshot:

```
Tool: take_screenshot
Server: user-chrome-devtools
Arguments:
  uid: "<element-uid-from-snapshot>"
  filePath: "/path/to/output/element-screenshot.png"
```

## Step 5: Pixel Diff Comparison

### Using Node.js Script

Create a comparison script (see `references/compare.js`):

```javascript
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';

// Load images
const original = PNG.sync.read(fs.readFileSync('original.png'));
const screenshot = PNG.sync.read(fs.readFileSync('screenshot.png'));

// Create diff
const diff = new PNG({ width: original.width, height: original.height });
const numDiffPixels = pixelmatch(
  original.data, screenshot.data, diff.data,
  original.width, original.height,
  { threshold: 0.1 }
);

// Calculate match percentage
const totalPixels = original.width * original.height;
const matchRate = ((totalPixels - numDiffPixels) / totalPixels * 100).toFixed(2);
console.log(`Match rate: ${matchRate}%`);

// Save diff image
fs.writeFileSync('diff.png', PNG.sync.write(diff));
```

### Interpreting the Diff

| Match Rate | Status | Action |
|------------|--------|--------|
| 99%+ | Excellent | Done - only anti-aliasing differences |
| 97-99% | Good | Minor tweaks needed |
| 95-97% | Acceptable | Check positioning, fonts |
| <95% | Needs work | Review coordinates, sizes |

## Step 6: Iterative Refinement

Based on diff results, common fixes:

### Position Issues (elements shifted)
```css
/* Adjust top/left values by 1-2px */
.element { top: 47px; } /* was 48px */
```

### Font Rendering Differences
```css
/* Try different font-smoothing */
.text {
  -webkit-font-smoothing: subpixel-antialiased;
}
```

### Alignment Issues with flex-end
```css
/* Use margin-bottom to align to baseline */
.label {
  margin-bottom: 8px; /* Adjust until aligned */
}
```

### Size Mismatch (@2x exports)
```css
/* Figma exports at 2x, display at 1x */
.original-image {
  width: 318px;  /* Half of 636px */
  height: 230px; /* Half of 460px */
}
```

## Quick Reference: Figma to CSS Mapping

| Figma Property | CSS Equivalent |
|----------------|----------------|
| `fill_*: ['#HEX']` | `background-color: #HEX` or `color: #HEX` |
| `borderRadius: '8px'` | `border-radius: 8px` |
| `strokeWeight: '1px'` | `border-width: 1px` |
| `stroke_*: ['#HEX']` | `border-color: #HEX` |
| `gap: '8px'` | `gap: 8px` (flexbox) |
| `padding: '8px 16px'` | `padding: 8px 16px` |
| `mode: 'row'` | `display: flex; flex-direction: row` |
| `mode: 'column'` | `display: flex; flex-direction: column` |
| `alignItems: 'center'` | `align-items: center` |
| `justifyContent: 'center'` | `justify-content: center` |
| `sizing.horizontal: 'hug'` | `width: fit-content` |
| `sizing.horizontal: 'fill'` | `flex: 1` or `width: 100%` |

## Example: Complete Workflow

```markdown
User: "Implement this Figma design: https://figma.com/design/abc123/File?node-id=1-234"

1. Extract fileKey (abc123) and nodeId (1-234) from URL
2. Call get_figma_data to get specifications
3. Call download_figma_images for any icons/images
4. Create HTML with absolute positioning using Figma coordinates
5. Apply positioning formula for text elements
6. Open in Chrome via new_page MCP tool
7. Take screenshot with take_screenshot
8. Run pixel diff comparison
9. Iterate: adjust positions, run diff again
10. Repeat until 98%+ match
```

## Troubleshooting

### "37% is too low" - Text Position Problem
- Check `line-height` value
- Use `line-height: 1` for precise control
- Subtract line-height offset from Figma y-coordinate

### "Label is misaligned" - Flex Alignment Issue
- Check if parent uses `align-items: flex-end`
- Add `margin-bottom` to push element up to baseline

### "Colors don't match"
- Ensure you're using exact hex values from Figma
- Check if element has multiple fills (use first one)

### "Screenshot size doesn't match"
- Figma may export at 2x (retina)
- Use `deviceScaleFactor: 2` when taking screenshots
- Or scale original image to 1x for comparison

---

## Installation & Distribution

### For Personal/Team Use

Place this skill folder in one of these locations:

```
# Project-level (recommended for team sharing)
your-project/.cursor/skills/figma-to-code/

# Or in project root
your-project/figma-to-code/
```

### Publishing to GitHub

To share this skill publicly:

1. Create a public GitHub repository
2. Structure it as:
   ```
   your-repo/
   └── figma-to-code/
       ├── SKILL.md
       ├── scripts/
       └── references/
   ```
3. Others can clone or reference your repo

### Discovery

Published skills can be discovered via:
- GitHub search for "agent-skills" or "SKILL.md"
- Community collections like [awesome-agent-skills](https://github.com/skillmatic-ai/awesome-agent-skills)
- Agent-specific skill directories
