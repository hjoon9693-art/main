# Handoff: Dusk — daily habit tracker (React Native + Expo)

## Overview
Dusk is a dark, calm mobile habit tracker. Users keep a daily checklist, tap a habit to complete it (it flips and drops onto a "done" pile), long‑press to edit, set per‑habit reminders, and watch a tree on the Home tab grow with their best streak.

## About the design files
`Dusk Habits Final.dc.html` is a **design reference built in HTML** — a working prototype of the intended look and behavior, not production code. Recreate it in **React Native + Expo** (TypeScript) using idiomatic RN patterns. The HTML's logic class (bottom `<script>`) is a useful reference for state shape, timing and the procedural tree drawing. (It was authored in a design tool; open it from the original project to run it — paths to its runtime and stylesheet won't resolve inside this folder.)

## Fidelity
**High‑fidelity.** Colors, type, spacing, motion timings and copy are final. Match them closely.

## Recommended stack
- Expo SDK (latest), TypeScript, Expo Router (2 tabs)
- `react-native-reanimated` (all motion), `react-native-gesture-handler` (tap / long‑press)
- `react-native-svg` (progress ring + tree)
- `expo-notifications` (local daily reminders), `@react-native-async-storage/async-storage` or `expo-sqlite` (persistence)
- `phosphor-react-native` (icons), `@expo-google-fonts/inter`
- `expo-haptics` (light impact on complete, medium on long‑press open)
- `expo-blur` for tab bar / banner backgrounds

---

## Design tokens (Nocturne)
**Colors**
- bg `#161826` · surface `#232532` · text `#e9e9ed` · accent `#9184d9`
- divider = text @ 16% alpha
- Accent ramp: 100 `#f5f4ff` 200 `#e7e5fe` 300 `#d2cefd` 400 `#b5abfc` 500 `#968ae0` 600 `#796cbf` 700 `#5d5294` 800 `#423a6a` 900 `#2b2741`
- Neutral ramp: 100 `#f3f5fe` 200 `#e4e7f5` 300 `#cfd3e5` 400 `#b2b6ca` 500 `#9397ab` 600 `#75798c` 700 `#595d6c` 800 `#3f424d` 900 `#292b31`
- Section glow (Home floor glow) `#353b80`
- Muted text = text @ 50–62% alpha. Never pure white/black.

**Rules**
- Accent is used as **lines and glows**, never large fills. Primary buttons are **outlined** (1px accent border, transparent fill; pressed = accent @ 12–24%).
- Freestanding rules fade to transparent over 48px at each end (use a horizontal LinearGradient).
- Heading weight max 500.

**Type** — Inter. Title 32/500 (‑0.02em), section 25/500, sheet title 20/500, habit name 16/500, body 14–15, meta 12, tags 11, kicker 10 uppercase +0.1em tracking in accent.

**Radius** — 8 (md), 14 (cards, lg), 12 (inputs/buttons in sheet), 28 (sheet top), 24 (banner).
**Elevation** — sm: 1px border `#3f424d`; md: 1px `#595d6c` + shadow 0/6/18 @ 55% black; lg: 1px `#9397ab` + 0/16/40 @ 65%.
**Spacing** — screen side padding 22 (headers) / 16 (lists); list gap 8.

---

## Screens

### Tab bar (both tabs)
Height 86 incl. 24 safe‑area. Background bg @ 86% + blur 18. Top edge: fading 1px rule. Two tabs: **Home** (`house-simple`) and **Today** (`list-checks`), icon 23, label 11/500. Active = accent color + a 22×2 accent bar at the top with 10px accent glow. Today shows a badge with remaining count (accent‑800 bg, accent‑100 text, 17px tall pill). Icon bounces on select (scale 1→.86→1.08→1, 360ms). Screens cross‑fade + slide 28px (opacity 280ms, translate 320ms `cubic-bezier(.2,.8,.2,1)`).

### Home
Top‑left glow: radial accent @ 13%. Bottom: radial section‑glow @ 60% behind the tree.
1. Kicker date ("Saturday, Oct 10") + greeting 32/500 ("Good morning/afternoon/evening/night" by hour: <5 night, <12 morning, <18 afternoon, else evening).
2. Progress row: 76px ring (r 32, stroke 5; track neutral‑800, progress accent with round cap + 4px glow, animates 600ms) with "NN%" centered 15/500. Right: "3 / 6" 25/500 (total muted), "3 left today" 13 muted, flame + "Best streak N days" 12 accent‑300.
3. Next reminder line: alarm icon (accent) · "Next reminder" muted · "21:00 · Read 20 pages" (ellipsize).
4. **Up next**: header "UP NEXT" 11 uppercase muted + ghost "All habits ›" (switches to Today). Up to 3 rows, 50px tall, surface, radius 14, sm elevation: empty circle 20px (1.5px neutral‑600), name 14/500, right meta (reminder time or time‑of‑day) 11 muted. Tap completes (see animation; target = Today tab icon). Empty: check‑circle + "All done for today" accent‑300.
5. **Tree** — centered, 240×240, sitting on a fading floor rule 104px above bottom. Tap → rustle + sparkles.

### Today
1. Kicker date + "Today" 32/500; right: 44×44 outlined accent "+" (radius 14) → Add sheet.
2. "3 of 6 done" / "Tap to complete · hold to edit" 12 muted; 2px progress line (accent with 10px glow, width animates 500ms).
3. Habit cards (min‑height 68, padding 12/16, radius 14, surface, sm elevation): 24px empty circle · name 16/500 (1 line) · tags row: time‑of‑day tag (neutral‑800 bg, neutral‑200 text, icon) + reminder tag if set (accent‑800 bg, accent‑100 text, bell + time) · right: flame + streak (accent‑300) if > 0.
4. Bottom fade (260px, bg → transparent) behind the **done pile**: 62px card 98px above bottom. Top card: accent‑800 check circle, last done name (75% text), "N day streak", right tag "N done"; border accent‑700 + 26px accent glow. Up to `pileDepth` (default 3) back layers: inset +10px per layer, translateY ‑7px per layer, opacity 1/.7/.4. Empty: dashed neutral‑700 box "Done habits stack here" with `stack` icon.
5. All done: 84px ring (1.5px accent, outer glow) with check, "Every habit done" 25/500, "N streaks extended tonight. See you tomorrow."
6. Empty (no habits): "No habits yet" / "Tap + to add your first one."

### Edit / Add sheet (modal bottom sheet)
Backdrop neutral‑900 @ 65% (tap = close). Sheet surface, radius 28 top, padding 10/20/36, gap 18, grabber 36×4.
- Title "Edit habit" / "New habit", close ×.
- **Name** input (48 tall, bg color fill, radius 12, focus caret accent). Empty on save → border accent‑300, shake (±6px, 300ms), message "Give the habit a name first." Enter = save.
- **Time of day**: 4 equal tiles (Morning `sun-horizon`, Afternoon `sun`, Evening `moon-stars`, Anytime `clock`), 52 tall, selected = accent border + accent @12% fill + accent‑300 text.
- **Reminder** panel (bg fill, radius 14): alarm icon, "Reminder", switch 48×28 (on: accent‑800 track, accent border, accent‑300 knob). When on: big time 36/500 tabular with −/+ (15‑min steps, wraps 24h) and 4 presets 07:00 · 12:30 · 18:00 · 21:00.
- Actions: "Delete" (secondary, edit only) + "Save"/"Add habit" (outlined accent, flex 1).
- Open: slide up 340ms `(.2,.8,.2,1)`; close: 240ms ease‑in.

### Reminder notification (in‑app banner while foregrounded)
Top, 10px side inset, radius 24, neutral‑900 @ 92% + blur. Moon icon tile, "Dusk · Reminder" + time, habit name 15/500. Buttons: "Snooze 10 min" (secondary) and "Mark done" (outlined accent). Drop‑in 520ms with slight overshoot. For OS notifications, register a category with the same two actions.

### Toast
Above pile (Today) or tab bar (Home). neutral‑900, md elevation, radius 14. "<Habit> — done" + "Undo" ghost button; auto‑hide 4.2s. Also "Reminder snoozed until HH:MM", "Habit deleted".

---

## Interactions & motion
**Complete (signature animation)** — duration by `animSpeed`: Gentle 1150 / Normal 800 / Snappy 540ms, easing `cubic-bezier(.45,0,.25,1)`.
1. Measure the card; render an overlay "ghost" card on top; hide the original.
2. Ghost keyframes (perspective 800): 0% none → 18% y −12, rotateX −22°, scale 1.04 → 55% halfway along an arc (x·0.5, y·0.42 − 36), rotateX −115° → 88% at target +7px, rotateX −180° → 100% at target. The back face is the pile card style (check + name, accent border + glow).
3. Target = pile (Today) scaled to its size, or the Today tab icon (Home) shrinking to scale (.12,.3) and fading out.
4. Simultaneously collapse the original row's height to 0 (duration 0.42×D, delay 0.3×D).
5. On finish: move habit to done list, pile bumps (y +5, scale .985, 300ms) or tab icon pops; tree rustles (Home); show Undo toast; light haptic.
**Undo** — reinsert at original index; card enters with rotateX 70°→0 + y 30→0, 420ms.
**Long‑press** (480ms) — card scales to .965 while holding; on fire: pop to 1.02, medium haptic, open Edit sheet. Release early = complete. Moving/scrolling cancels.
**All done** — ring pops (scale .4→1.12→1), expanding halo ring (scale 1→3.2, fade, 1.1s), ~34 small accent particles burst outward (0.9–1.5s).
**New day** — at local midnight: completed habits streak +1, missed habits streak → 0, done pile clears, original order restored.
Respect "Reduce Motion": disable idle loops and use simple fades.

## The tree (Home)
Stage by **best streak** (max current streak across habits, counting today if done):
- 0 → seed (glowing pulse) · ≥1 sprout (2 leaves) · ≥7 leafy stem (5 leaves) · ≥14 small tree · ≥30 tree (branches, 7 clumps, 1 falling leaf) · ≥100 full tree (8 clumps, 4 glowing buds, 2 falling leaves, 3 fireflies).
- Users never see stage labels or numbers — growth is only visual.
- Drawing (react-native-svg, 240 viewBox, ground y 212): mound neutral‑900/800; trunk neutral‑800 with neutral‑600 lit side + neutral‑400 highlight stroke; canopy "clumps" = circle + 5 bump circles in accent‑800, offset inner circle accent‑700, upper‑left highlight ellipse accent‑600 + a 1.6px accent‑300 arc. Exact clump coordinates per stage are in `plantArtPainted()` in the HTML. No blur/drop‑shadows (keeps it crisp).
- Idle motion (very subtle): whole plant sway ±1.6° (5.5s alternate, origin at base), leaves flutter ±6°, canopy breathe scale 1.015 (5s), buds pulse opacity .45↔1 (3.4s), falling leaves 7s loop, fireflies drift 6s.
- Stage change: scale .82→1.04→1, 900ms. Tap / completion: rustle rotate −3.5→2.5→−1.2→0 (850ms) + 4 rising sparkles.
- Consider exporting each stage as a static SVG and animating groups with Reanimated.

## State
```ts
type TimeOfDay = 'morning'|'afternoon'|'evening'|'anytime';
type Habit = { id: string; name: string; tod: TimeOfDay; rem: boolean; time: number /*minutes from midnight*/; streak: number; ord: number };
type DoneEntry = { habit: Habit; index: number; at: number };
state: { tab: 'home'|'today'; habits: Habit[]; done: DoneEntry[]; leaving: Record<string, true>; editing: (Habit & {isNew:boolean}) | null; toast; banner }
settings: { animSpeed: 'Gentle'|'Normal'|'Snappy'; pileDepth: 1–5 (3); timeFormat: '24h'|'12h' }
```
Persist habits, done‑today (with date), streaks and settings. Reschedule a daily local notification per habit when `rem`/`time` changes; cancel on delete.

## Seed data
Drink a glass of water (Morning, 07:30, streak 12) · Stretch for 10 minutes (Morning, 5) · Walk outside (Afternoon, 12:30, 3) · Read 20 pages (Evening, 21:00, 23) · Journal three lines (Evening, 22:15, 1) · No screens after 23:00 (Evening, 8).

## Assets
- Icons: Phosphor (regular): plus, bell, bell-ringing, alarm, flame, check, check-circle, x, minus, trash, arrow-counter-clockwise, caret-right, stack, sun-horizon, sun, moon-stars, clock, house-simple, list-checks.
- Font: Inter 400/500/600.
- Tree: procedural SVG (no bitmap assets).

## Files
- `Dusk Habits Final.dc.html` — final prototype (template = layout/styles; bottom script = logic, motion, tree drawing). Top bar controls ("Simulate reminder", "Start next day", "Preview growth") are prototype‑only.
- `nocturne-styles.css` — Nocturne token sheet (source of all colors/radii/shadows).
- `screenshots/` (2×, 780×1688, device frame included — the app screen is 368×822 pt inside it):
  - `01-home.png` Home tab · `02-today.png` Today tab · `03-today-done-pile.png` after completing two habits (pile + Undo toast)
  - `04-edit-sheet.png` long‑press edit sheet with reminder on · `05-reminder.png` in‑app reminder banner
  - `06-tree-day1.png` · `07-tree-day7.png` · `08-tree-day14.png` · `09-tree-day100.png` tree growth stages (30‑day stage is in `01-home.png`)
