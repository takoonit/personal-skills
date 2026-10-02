# Diagram design notes

[HTML guide](skills-workflow.html) · [README](../README.md)

Created with Diagram Design using each skill's `SKILL.md` instructions. The diagrams help you choose a skill for your task. You do not need to use every skill.

## Design reference

[Optikka](https://optikka.com/), checked in Chrome and with Firecrawl on 2 October 2026. The page's CSS confirmed the colors and fonts below.

| Use | Color | How it was chosen |
| --- | --- | --- |
| Background | `#e6d9cc` | Same as Optikka's background |
| Text and links | `#443218` | Same as Optikka's headings and menu text |
| Orange highlight | `#fd4319` | Same as Optikka's section headings |
| Darker background | `#ddcebe` | A darker beige chosen for this guide |
| Text on orange | `#1a1715` | Dark text chosen to stay readable |
| Smaller text | `#675540` | A brown chosen to stay readable |
| Thin borders | `rgba(68,50,24,.18)` | The text color at lower opacity |
| Stronger borders | `#a99a87` | A brown chosen for this guide |
| Pale orange fill | `rgba(253,67,25,.08)` | The orange color at lower opacity |
| Corners | Square | Same shape as the site's corners |

Optikka uses `PPNeueMontreal`, weight 500, for headings and body text, from its own [font file](https://optikka.com/assets/fonts/PPNeueMontreal-Medium-5rVKzqK_.woff2). The site also defines JetBrains Mono at weight 400.

The guide uses **Geist instead of Neue Montreal** and **Geist Mono for commands**, both from [Google Fonts](https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap). It uses Optikka's colors, large headings, and spacing with these replacement fonts.

## Editing the guide and images

Edit the [HTML guide](skills-workflow.html) first, then regenerate the PNG images from it. The HTML contains both diagrams as SVGs, with text explanations below. Its only external file is the Google Fonts stylesheet. On a phone, scroll each diagram sideways to see the rest; the page text fits the screen.

The first diagram shows four steps: choose, plan, build, and check. Each step says when to use the skill, what to provide, and what you get. The second diagram groups the other six skills by task.

Both diagrams are 1280 × 720. The README images are saved at twice that size, 2560 × 1440. They include the diagram's beige background:

- [Steps PNG](assets/skills-workflow.png)
- [Other tasks PNG](assets/skills-specialists.png)

After editing, check both diagrams at desktop and phone widths. To save the images with Playwright, wait for `document.fonts.ready` and capture each SVG at 2×. Keep the HTML and PNGs in sync, and check the wording against the current `SKILL.md` instructions.
