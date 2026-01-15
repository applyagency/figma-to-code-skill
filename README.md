# Figma to Code Skill

An [Agent Skills](https://agentskills.io) compatible skill for pixel-perfect implementation of Figma designs.

## Features

- **98%+ pixel accuracy** using iterative visual validation
- **Figma MCP integration** for extracting exact specifications
- **Chrome DevTools MCP** for screenshot comparison (no Puppeteer needed)
- **Positioning formulas** to solve line-height offset problems
- **Works with any agent** supporting the Agent Skills standard

## Supported Agents

- [Cursor](https://cursor.sh)
- [GitHub Copilot](https://github.com/features/copilot)
- [Claude Code](https://claude.ai)
- [Amp](https://amp.dev)
- [Goose](https://github.com/block/goose)
- Any agent implementing the [Agent Skills specification](https://agentskills.io/specification)

## Prerequisites

Before using this skill, ensure you have these MCP servers enabled:

1. **Figma MCP** (Framelink) - for extracting design specs
2. **Chrome DevTools MCP** - for taking screenshots

## Installation

### Option 1: Copy to your project

```bash
# Copy the skill folder to your project
cp -r figma-to-code your-project/.cursor/skills/
```

### Option 2: Clone from GitHub

```bash
git clone https://github.com/your-org/figma-to-code-skill.git
```

## Usage

1. Provide the agent with a Figma link:
   ```
   Implement this design: https://figma.com/design/abc123/File?node-id=1-234
   ```

2. The agent will:
   - Extract specs via Figma MCP
   - Download required icons/images
   - Create HTML/CSS with precise positioning
   - Take screenshots and run pixel diff
   - Iterate until 98%+ match

## Key Concepts

### Positioning Formula

Figma coordinates assume bounding box positioning, but CSS text has line-height offsets:

```
offset = (line-height - 1) × font-size ÷ 2
corrected_top = figma_y - offset
```

Or use `line-height: 1` to eliminate the offset entirely.

### Pixel Diff Workflow

```
Original PNG → Implementation Screenshot → pixelmatch → Diff Image → Iterate
```

## Files

```
figma-to-code/
├── SKILL.md                    # Main skill instructions
├── README.md                   # This file
├── references/
│   ├── positioning-formulas.md # Detailed positioning guide
│   └── html-template.html      # Starter template
└── scripts/
    ├── compare.js              # Pixel diff script
    └── package.json            # Script dependencies
```

## License

MIT
