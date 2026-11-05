# Kinetic typography

Use with the shared foundations. Movement should make the message more intelligible or memorable; type remains readable content before it becomes an effect.

## Character and fit

Let words be the principal image. Useful for launches, performances, creative campaigns and concise cultural messages. The fit comes from the visitor's interest in the message and experience, not an assumption that young audiences want constant motion. Long reading, price comparison and repeated tasks need quiet typography around the focal sequence.

The main costs are localisation, reading pace and animation engineering. A font that looks dramatic in a short English phrase may fail with Thai combining marks, longer translations or fallback fonts. Choose the static composition first.

## Composition, colour and type rules

- Establish a legible resting layout for the complete message. Specify what the visitor sees before playback, after playback and if playback never runs. Do not scatter the only meaningful sentence across time.
- Choose one dominant typographic device: scale change, word replacement, line reveal, weight shift or spatial arrangement. Add another only if it has a different communicative role. Do not combine stretch, spin, blur and stagger simply because the library supports them.
- Reserve a stable region for navigation, supporting explanation and the primary action. Keep controls outside moving masks and avoid moving targets.
- Choose type for real words, not a font specimen. Define line-break intent for representative widths, and allow content to reflow. Never hardcode desktop line breaks across every language.
- Use a limited foreground/background relationship so the phrase remains the focus. Assign a deliberate accent to a meaningful word or category; do not cycle unrelated rainbow colours through every letter.
- Use clipping only for an entrance treatment with verified final visibility. Do not cut diacritics, ascenders or descenders. Distorted decorative duplicates must not replace the readable original.

## All six techniques

| Technique | Concrete application |
|---|---|
| Anchor typography | Select the display family, relevant weights/axes and stable supporting roles. Check all required scripts and font-loading fallbacks. Supporting paragraphs, form labels and prices do not inherit the display animation. |
| Star of the show | Choose one meaningful phrase with a defined resting composition. State what it communicates and keep the offer/action available before its sequence finishes. |
| Visual rhyming | Repeat one letterform feature or movement direction in two subordinate places, such as section labels and navigation emphasis. A static echo can rhyme with the main movement without animating everything. |
| Subtle depth | Use a restrained tonal plane, outlined echo or overlapping type layer behind the main phrase. Keep the duplicate decorative and prevent letter collisions that change the reading. |
| Text opacity and emphasis | Assign readable resting levels for display, explanation and incidental text. Essential words cannot depend on briefly reaching full opacity during a loop. Use static hierarchy outside transitions. |
| Design variations | Compare a compact animated statement with a large sectional composition using identical copy. Compare static/reduced-motion forms too; reject a variation that only communicates during playback. |

## Components and motion contract

For each sequence record trigger, readable start/end, affected words, pacing, pause/replay and interruption. Prefer one typographic focal sequence per viewing region. Scroll position may control progress while native scrolling remains intact; the user must be able to pass through, go back or follow an anchor without being trapped.

Keep navigation, inputs and paragraphs stable. Hover emphasis needs keyboard-focus equivalence, but focus must not trigger a disorienting replay. If a marquee is justified, provide controls where required and a useful static equivalent. Repeated decorative copies must not create duplicate announcements or extra tab stops; retain one meaningful accessible text sequence. Do not add live-region announcements for every decorative word change.

## Mobile, localisation and delivery

Segment text with script-aware word/grapheme handling when splitting is necessary. Do not split JavaScript strings into code units. Test actual Thai content, fallback fonts and long translations before locking masks or timing.

On narrow screens, permit fewer simultaneous lines/effects and a simpler reading order. Reduced motion shows the meaningful resting composition with content fully visible; disabling a timeline must also remove its hiding styles. Reserve the animation region to avoid layout jumps. Prefer inexpensive property changes where suitable, but profile font-axis animation and large masks instead of claiming they are free.

## Failure patterns and review

| Reject | Verify instead |
|---|---|
| Visitors wait to discover the offer | Full meaning and primary action are available immediately |
| Text is attractive only during a frame of motion | Start, end and reduced-motion layouts stand alone |
| Every scroll restarts the sentence | Replay and interruption behaviour are deliberate |
| English works while Thai clips or breaks | Real multilingual wrapping and shaping are inspected |

Possible project rules: animate only the campaign headline; keep supporting copy static; use one reveal direction; render the full statement when motion is reduced. Translate the selected rules into scoped component and motion instructions.
