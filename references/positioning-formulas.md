# Figma to CSS Positioning Formulas

## The Core Problem

Figma reports `locationRelativeToParent.y` as the distance from the parent's top edge to the **top of the element's bounding box**. However, CSS text rendering with `line-height > 1` adds extra space above and below the text.

## Line-Height Offset Formula

```
extra_space = (line-height - 1) × font-size
offset_per_side = extra_space ÷ 2
```

### Example Calculation

For a heading with:
- `font-size: 48px`
- `line-height: 1.2`

```
extra_space = (1.2 - 1) × 48 = 9.6px
offset_per_side = 9.6 ÷ 2 = 4.8px
```

If Figma says `y: 48`, the corrected CSS would be:
```css
top: 43px; /* 48 - 5 (rounded) */
```

## Recommended Approach

**Use `line-height: 1` to eliminate the problem entirely:**

```css
.heading {
  font-size: 48px;
  line-height: 1;        /* No extra space */
  top: 48px;             /* Use Figma y directly (or with small adjustment) */
}
```

## Common Adjustments Table

| Font Size | Line-Height | Offset | Adjustment |
|-----------|-------------|--------|------------|
| 48px | 1.2 | 4.8px | -5px |
| 48px | 1.0 | 0px | 0px |
| 16px | 1.05 | 0.4px | 0px |
| 12px | 1.45 | 2.7px | -3px |

## Flex Alignment Adjustments

When using `align-items: flex-end`:

```css
.label {
  /* Push up to align with text baseline */
  margin-bottom: 8px; /* Adjust iteratively */
}
```

## @2x Retina Export Handling

Figma often exports at 2x scale (devicePixelRatio: 2).

**For screenshots:**
```javascript
// Take screenshot at 2x to match Figma export
deviceScaleFactor: 2
```

**For display:**
```css
/* Display @2x image at 1x size */
.figma-export {
  width: 318px;  /* Half of 636px */
  height: 230px; /* Half of 460px */
}
```

## Quick Reference

| Figma Value | CSS Property | Notes |
|-------------|--------------|-------|
| `x: 16` | `left: 16px` | Direct mapping |
| `y: 48` | `top: 43-48px` | Adjust for line-height |
| `width: 318` | `width: 318px` | Direct mapping |
| `height: 230` | `height: 230px` | Direct mapping |
| `gap: 8px` | `gap: 8px` | Flexbox gap |
| `padding: 8px 16px` | `padding: 8px 16px` | Direct mapping |
