---
name: UCC 유크크
description: 학생회·동아리 운영 콘솔. 작년 위에서 시작하고, 숫자를 문장으로 말한다.
colors:
  ground: "#f4f5f7"
  surface: "#ffffff"
  surface-2: "#f9fafb"
  panel: "#eef0f3"
  ink: "#15181d"
  ink-2: "#4a515c"
  ink-3: "#6b7380"
  ink-4: "#a3aab5"
  line: "#e3e6eb"
  line-strong: "#cfd4db"
  coral: "#f0503f"
  coral-deep: "#d3382a"
  coral-ink: "#b8301f"
  coral-tint: "#fdeeec"
  coral-line: "#f6b9b1"
  green: "#0e9b72"
  green-ink: "#0a7656"
  green-tint: "#e6f5f0"
  amber-ink: "#8a5a00"
  amber-tint: "#fdf3dc"
  dept-plan: "#3d5ae0"
  dept-admin: "#0e9b72"
  dept-promo: "#f0503f"
  dept-head: "#7c5bd6"
typography:
  display:
    fontFamily: "Pretendard Variable, system-ui, -apple-system, Apple SD Gothic Neo, sans-serif"
    fontSize: "clamp(30px, 4vw, 40px)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  numeral:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: "40px"
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "32px"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: "24px"
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "-0.012em"
  meta:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "-0.012em"
  label:
    fontFamily: "Pretendard Variable, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 600
    lineHeight: "16px"
    letterSpacing: "-0.012em"
rounded:
  sm: "8px"
  md: "10px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  sidebar: "248px"
  content-max: "1120px"
components:
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.coral-deep}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-2}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-ink-hover:
    backgroundColor: "{colors.ink-2}"
  button-ghost:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
  badge-live:
    backgroundColor: "{colors.coral-tint}"
    textColor: "{colors.coral-ink}"
    typography: "{typography.label}"
    rounded: "6px"
    padding: "2px 6px"
  badge-amber:
    backgroundColor: "{colors.amber-tint}"
    textColor: "{colors.amber-ink}"
    typography: "{typography.label}"
    rounded: "6px"
    padding: "2px 6px"
  badge-green:
    backgroundColor: "{colors.green-tint}"
    textColor: "{colors.green-ink}"
    typography: "{typography.label}"
    rounded: "6px"
    padding: "2px 6px"
  field-blank:
    backgroundColor: "{colors.coral-tint}"
    textColor: "{colors.coral-ink}"
    rounded: "{rounded.md}"
    height: "44px"
  field-carried:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "0 16px 0 40px"
    height: "48px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "16px"
  card-feature:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  chip-choice-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "36px"
  chip-choice:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "36px"
  nav-row-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "36px"
---

# Design System: UCC 유크크

## Overview

**Creative North Star: "The Ledger That Carries Forward"**

UCC is a bright, cool working surface where every number is a sentence and every form starts from last year. The page is a cool grey ground with white work surfaces laid on it, a near-black ink, and a single warm coral that only appears where something needs a hand right now: the one primary action, the event that is live, and the blank a person has to fill in. Everything else is grey-scale, so the coral reads as an instruction rather than decoration.

Density is product-UI density, not dashboard density. It uses the standard pattern of a sidebar and body (a bottom tab bar on mobile), but there are no metric-card grids or charts. Status is written as Korean sentences in 해요체 ("열린 지 56분, 48명이 신청했어요. 치킨마요덮밥 3개 남았어요."), and the large tabular numerals beneath each sentence are its evidence. Records from past terms sit next to the form you are filling in, so the history is part of the work, not a separate report.

Depth is quiet: one-pixel cool lines, faint offset shadows on lifted surfaces only, and no glass, gradients, or icon-tile cards.

**Key Characteristics:**
- Cool grey ground, white surfaces, ink text; coral used for action, the live state, and blanks only.
- Pretendard is the only typeface; every count, time, and ID uses tabular numerals.
- Numbers are written as sentences first and shown as big numerals second.
- Duplicate-form language: grey means "carried over from last time", a coral dashed field means "change this".
- 1px lines, 12px corners, faint offset shadows; flat everywhere else.

## Colors

A cool neutral working palette with one warm action color and three quiet semantic tints.

### Primary
- **Signal Coral** (coral): The only saturated color in the product. Used for the single primary action on a surface ("새 행사 만들기", "공개하기", "행사 끝내기"), the live/now state (the pulsing dot in the 신청 중 badge, remaining-stock bars, today's date in the agenda), the active nav icon, the focus ring, the text caret, and blank fields.
- **Pressed Coral** (coral-deep): Hover and pressed fill for coral buttons. Never used as a standalone fill.
- **Coral Ink** (coral-ink): Coral as readable text on white or tint: low-stock numerals, blank-field text, the "채울 칸 N" count, the live badge label.
- **Coral Wash** (coral-tint) / **Coral Rule** (coral-line): The live badge background, blank-field fill (at 60%), the fresh-row flash, text selection, and the soft ring around a focused field.

### Secondary
- **Available Green** (green, green-ink, green-tint): "Still there / can borrow / done." Green chips for auto-filled info (이름·학번·학년), the 받음 badge, the "다 채웠어요" state, and preview text that follows the form fields live.

### Tertiary
- **Late Amber** (amber-ink, amber-tint): Overdue and attention-but-not-urgent states, e.g. "1일 넘게 반납 안 된 대여", "N일 지남", exam-period bands in the calendar, the 남은 건 phase badge, and dispute requests. Amber is not coral: lateness is not an action.

### Department Layer
- **Plan Blue** (dept-plan), **Admin Green** (dept-admin), **Promo Coral** (dept-promo), **Head Violet** (dept-head): Student-council department colors. They appear only as calendar layer dots and org-chart marks, never as UI chrome.

### Neutral
- **Cool Ground** (ground): Page background behind everything.
- **Work Surface** (surface): Cards, panels, the active nav row, inputs.
- **Carried Grey** (surface-2): Carried-over fields, done rows, inner stat cells, and the inset greeting textarea.
- **Panel Grey** (panel): Segmented-tab track, quiet buttons, the sidebar (at 60%), neutral badges, progress tracks.
- **Ink** (ink) through **Ink 4** (ink-4): Text in four steps: primary, secondary/body-secondary, meta, and disabled/placeholder/empty.
- **Line** (line) / **Strong Line** (line-strong): 1px borders and dividers by default; the strong line is for interactive borders (secondary buttons, inputs, unselected chips, filled blanks).

### Named Rules
**The Three Coral Jobs Rule.** Coral marks only three things: the primary action, what is happening now, and the blank you must fill. If a coral element is none of these, it should be ink, green, or amber.

**The Amber Is Late Rule.** Overdue, waiting, and out-of-season states use amber tint with amber ink. They never use coral and never red.

**The Never-Color-Alone Rule.** Every colored state also carries words or shape: badges have labels, blanks are dashed, and low stock shows its number.

## Typography

**Display Font:** Pretendard Variable (with system-ui, -apple-system, Apple SD Gothic Neo)
**Body Font:** Pretendard Variable
**Label/Mono Font:** none; numerals use Pretendard with `tabular-nums`

**Character:** A single neutral Korean grotesque, set slightly tight (-0.012em body, -0.025em headings) with `word-break: keep-all`, so Korean sentences break on word boundaries and read like plain speech. The hierarchy comes from weight and size, not from a second family.

### Hierarchy
- **Display** (700, 30px to 40px, 1.25): Landing/role-picker headline only.
- **Numeral** (700, 26px mobile to 34px desktop, 32/40px, tabular): Live remaining and applied counts in the live panel; 30px on walk-up cards; 22px for `Stat`.
- **Headline** (700, 22px mobile to 24px desktop, 32px): Page titles. These are sentences addressed to the person ("서연님, 오늘 챙길 게 2가지 있어요"). Event titles inside the live panel use 18px to 20px.
- **Title** (700, 15px, 24px): Section and group titles ("수령", "작년 이맘때 한 것"). Sub-sections use 13.5px to 14px bold.
- **Body** (400 to 600, 14px, 24px): Rows, descriptions, and status sentences. The live status sentence uses 15px to 16px semibold.
- **Meta** (400 to 500, 12.5px to 13px): Timestamps, hints, section asides, list sublines.
- **Label** (600, 11.5px, 16px): Badges and tab-bar labels (11px). No uppercase, no tracking.

### Named Rules
**The Tabular Rule.** Every number that can change or be compared (counts, sequence numbers, student IDs, times, D-days) uses tabular numerals so columns do not jitter while rolling.

**The Sentence-First Rule.** A screen's state is stated in a 해요체 sentence before it is shown as a numeral. The numeral is evidence, not the headline.

**The Title Speaks Alone Rule.** Page titles have no small label stacked above them; context goes in the one-line description underneath.

## Layout

The desktop layout (lg, 1024px and up) is a two-column grid: a 248px sticky sidebar on a 60% panel-grey wash, and a body with content centered at a 1120px max width (16px side padding, 32px from md). Below lg, the sidebar becomes a sticky 56px top bar with the logo and avatar, plus a fixed 56px bottom tab bar (home, find, calendar, org, and an operator tab for officers). The body reserves 112px of bottom padding for it.

The rhythm is 4px-based: 12px between a section title and its content, 8px to 12px between rows, 32px between form groups, and 20px to 32px between page header and content. Editing screens use a main column plus a 300px sticky right rail for past records (`1fr 300px`). Form rows use a 104px label column from sm up and stack on mobile. Long forms end in a sticky action bar that sits above the mobile tab bar and aligns to the content column on desktop.

Controls are sized for one-handed use in the field: primary field controls and mobile-tappable actions are 44px to 48px tall. Compact 32px controls grow to 44px on mobile (`h-11 sm:h-8`).

## Elevation & Depth

The system is flat with a light lift. Surfaces separate from the ground mostly by their white fill and a 1px cool line. Shadows are faint, offset downward, and cool-tinted from the ink color. They are used only on primary lifted surfaces (feature cards, the live panel, the active nav row, the selected tab, coral primary buttons) and on popovers.

### Shadow Vocabulary
- **Rest lift** (`box-shadow: 0 1px 2px rgba(21,24,29,0.06), 0 2px 6px -2px rgba(21,24,29,0.06)`): Live panel, feature cards, active nav row, selected segmented tab, coral primary button.
- **Float** (`box-shadow: 0 2px 4px rgba(21,24,29,0.04), 0 10px 24px -12px rgba(21,24,29,0.18)`): Dropdown pickers (staff picker) and the landing role card.

### Named Rules
**The Faint Offset Rule.** Shadows are soft, downward, and ink-tinted. They are never hard offsets, never colored glows, and never stacked heavier than Float.

**The Solid Chrome Rule.** Sticky bars (mobile top bar, tab bar, form action bar) are 90 to 95% opaque with a small blur so content can pass under them. Cards and panels are always solid; glass is not a surface treatment.

## Shapes

Corners are gently rounded and consistent: 10px for buttons, fields, blanks, and carried fields; 12px for cards, lists, inputs that stand alone (search), and the segmented-tab track; 8px for nav rows, inner tabs, and inner stat cells; 6px for badges. The 16px radius is reserved for the one primary container on a screen (the live panel, the apply panel, the event detail article, the "start from last year" card). Choice chips and auto-filled info chips are full pills. Avatars are initial circles, not photos. Lists are bordered 12px boxes with 1px internal dividers rather than separate cards. The only dashed borders are the coral blank, the empty state, and the "saved only" calendar dot.

## Components

### Buttons
Compact and solid, with a 1px press-down on `:active`.
- **Shape:** gently rounded (10px). Sizes are sm 32px / 13px, md 40px / 14px, lg 48px / 15px, plus a 40px square icon button. Semibold label with a lucide icon at 14 to 18px.
- **Primary:** coral fill, white text, rest-lift shadow. Hover goes to coral-deep. One per surface.
- **Ink:** ink fill, white text. The repeated field action ("드리고 체크", "1개 줬어요", "이걸로 시작하기"), so that coral stays scarce.
- **Secondary:** white with a strong-line border. Hover shows the carried-grey fill and an ink-4 border.
- **Quiet / Ghost:** panel-grey or transparent with ink-2 text, for demo and tertiary actions.
- **Danger:** coral-ink text with no fill, coral wash on hover. Kept away from the primary button ("초안 버리기" sits left of 저장/공개하기).
- **Focus / Disabled:** a 2px coral outline at a 2px offset everywhere. Disabled is 45% opacity with no pointer events.

### Chips
- **Choice chips (radio):** 36px pills. Selected is an ink fill with white text. Unselected is white with a strong-line border.
- **Summary chips:** 36px pills in the "오늘 챙길 것" line. Amber for overdue, white outlined for neutral.
- **Info chips:** 32px green-tint pills with a check, for data the system fills in automatically.

### Badges
Small 6px-rounded labels (11.5px semibold). Tones: neutral, coral (live, with a pulsing coral dot), green (받음 / done), amber (leftover / late / dispute), ink, outline (scheduled).

### Cards / Containers
- **Corner Style:** 12px default, 16px for the screen's one feature container.
- **Background:** white surface on the cool ground. Done or inner cells use carried grey.
- **Shadow Strategy:** flat with a line at rest. Rest lift only on feature containers (see Elevation).
- **Border:** 1px line.
- **Internal Padding:** 14px to 16px for list cards, 16px to 24px for the live panel, 20px to 28px for feature articles.

### Inputs / Fields
- **Style:** white fill, 1px strong-line border, 10px radius (12px for the 48px search field), 14px to 15px text, ink-4 placeholder. The caret is coral. Mobile inputs are forced to 16px to prevent zoom.
- **Focus:** the border shifts to coral, or a 2px coral-line ring for wrapped fields.

### Navigation
- **Sidebar:** the coral primary button sits at the top, followed by grouped 36px rows (14px medium) under 12px semibold group labels. The active row is a white surface with rest lift, ink text, and a coral icon. Inactive rows are ink-2 with an ink-3 icon and a line wash on hover.
- **Tab bar (mobile):** a 56px fixed bar, with 21px icons over 11px semibold labels. The active tab has an ink label, a coral icon, and a heavier stroke (2.2 vs 1.8).
- **Segmented tabs:** a panel-grey 12px track. The selected segment is a white 8px pill with rest lift. Tab labels carry tabular counts ("수령 12/48").

### Duplicate Form Fields (signature)
The visual core of "start from last year." Each field is 44px tall with a 10px radius and 14.5px text.
- **Blank:** a field this event must change. A 2px dashed coral border on a 60% coral wash, with coral-ink text and placeholder. Once filled, it becomes a normal white field with a 1px strong line. The page header counts the open blanks ("채울 칸 4"), and the sticky bar lists them by name.
- **Carried:** a value brought over from last time. Carried-grey fill, 1px line, ink-3 text. It turns ink with an ink-4 border on focus. A muted hint under the label says where the value came from ("자주 쓰는 시간").

### Live Event Panel (signature)
The 16px feature container on the operator home and the event page. It contains a phase badge and open time, the event title, a 해요체 status sentence, then a 1px-gapped grid of stat cells. The first cell shows applied/total, and each menu cell shows its remaining count as a large rolling numeral with a 6px progress bar (coral, ink-4 when sold out; the numeral turns coral-ink when low). Below that is the most-recent-first applicant list.

### Rolling Number (signature)
When a count changes, the new value rises from below: `translateY(55%)` with a 2px blur clearing to rest, over 320ms `cubic-bezier(0.16, 1, 0.3, 1)`. Newly arrived applicant rows flash coral wash and fade out over 1600ms. Both are disabled under `prefers-reduced-motion`, and the true value is always present for screen readers.

### Agenda
A day-by-day list. A 60px tabular date column (coral-ink for 오늘) sits beside 12px-rounded event rows, each with a layer dot, a tabular time, a title, and a subline. Empty stretches collapse into one ink-4 line, and season bands render as amber strips.

## Do's and Don'ts

### Do:
- **Do** keep coral to its three jobs: one primary action per surface, the live/now state, and blanks.
- **Do** use ink-filled buttons for repeated field actions, so coral stays rare.
- **Do** use amber tint + amber ink for anything overdue or late.
- **Do** write state as a 해요체 sentence with numbers in it, then show the tabular numeral underneath.
- **Do** apply `tabular-nums` (the `num` utility) to every count, ID, time, and D-day.
- **Do** show carried-over values in grey (surface-2, ink-3) and fields to change as coral dashed blanks.
- **Do** keep field-use touch targets at 44px or more, and grow 32px controls to 44px on mobile.
- **Do** use 12px corners and 1px lines by default, and save 16px for the screen's single feature container.
- **Do** use lucide icons from one set, at 14 to 21px, inline with text.

### Don't:
- **Don't** build metric-card grids, charts, or KPI tiles. Numbers belong in sentences and the live panel.
- **Don't** use coral for overdue states, record statistics, or decoration.
- **Don't** use glass cards, gradients, or icon-in-a-tile cards.
- **Don't** add a second typeface, uppercase labels, or letter-spaced captions.
- **Don't** stack a small label or eyebrow above page titles.
- **Don't** use hard offset shadows, colored glows, or shadows heavier than Float.
- **Don't** use department colors outside calendar layers and the org chart.
- **Don't** signal a state with color alone. Pair it with a word, a count, or a dashed/solid shape.
