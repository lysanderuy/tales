# Tales: Product Requirements Document

**Status:** Draft v0.6
**Date:** Nov 8, 2026
**Owner:** Lysander
**Inputs:** tales_brief.md, tales_competitors.md, design discussion on Oct 18 and 19, 2026, the built app, the design tokens (src/styles/tokens.css, described in docs/design-system.md), and photos of review center lecture guides (CRPDC Immunology and Serology / Blood Banking; Padayon Notes Clinical Microscopy; Cerebro Lecture Guides for the March 2027 MTLE).

**What changed in v0.6:** the body now describes only what is live. Specified features that have no UI yet moved to section 13, "Planned (not yet live)", with their original text. Entity fields, limits and account features match the code. Flows are numbered 1 to 13 in order, and the Today list, Events, Subjects, Plan and end screen text was checked against the code.

**What changed in v0.5:** this file now lives in the repo and is aligned with what is built. Subject and Topic names allow up to 200 characters. A Session's state is derived, not stored. She can log a past Session by hand. Plan groups Blocks into time-of-day bands. A Block that was started off its planned time shows when it actually started. Truncated Subject and Topic names show in full in a tooltip. Email confirmation at sign up is on, with no welcome email.

**What changed in v0.4:** the Today layout (centered tabs, Start at the top right of the content), the Picker (search first, Subjects open a side panel), the Focus mode tools (Method and Note under the controls, note in a plain box), the end screen (labelled sections, a Save button, Next up as a plain row), the Custom countdown (type a number and press Enter), and a correction: Clinical Microscopy does have a breakdown. The Overtime color is decided. The "Time's up" choice in Focus mode is replaced by an Add time ("+") tool.

**How to use this document:** It is written to feed user stories, architecture docs and screen mockups. The terms in the glossary are fixed. Use them exactly as written. Anything marked _(Post-MVP)_ is out of scope for the first build. Anything marked _(provisional)_ is a default that can still change. Features specified but not live are in section 13. Open items are listed in section 12.

**Words:** Internal names (Session, Block, Link, Outline Node) are used to describe behavior. Anything shown on screen uses the screen words defined in the glossary and the copy rules.

---

## 0. Glossary

| Term                            | Meaning                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tales**                       | The product. A calm study planner and timer for medtech board review.                                                                                                                                              |
| **Student**                     | The only user role. A board examinee using Tales on her own account.                                                                                                                                               |
| **Subject**                     | A top-level item in the Subjects tab, like Hematology or ISBB. A Subject can have Topics under it or none.                                                                                                         |
| **Topic**                       | Any item under a Subject, at any depth. A Topic can have child Topics. Example: ISBB › Blood Banking › Blood grouping.                                                                                             |
| **Subjects**                    | The tab where she builds and views her Subjects and Topics. The tree is not called "syllabus", "outline" or "blueprint" anywhere in the product.                                                                   |
| **Outline Node**                | Internal data-model name for a Subject or Topic. Never shown on screen, in help text or in UI copy.                                                                                                                |
| **Path**                        | A Subject or Topic written with its parents, shown as `ISBB › Blood Banking › Blood grouping`.                                                                                                                     |
| **Exam weight**                 | An optional percentage she types for a Subject or Topic, copied from her review center notes. A reference only. Never a target.                                                                                    |
| **Study Block** (UI: **Block**) | A planned piece of study: a Subject or Topic on a date, with optional planned minutes and optional time of day. Called Block on the Plan tab only. Elsewhere it appears as a planned row.                          |
| **Day Plan**                    | The Blocks on one date, in order.                                                                                                                                                                                  |
| **Session**                     | Internal name for a record of time she actually studied: a Subject or Topic, a start, an end, and optional note and method tag. Never shown on screen. Her list of past records is the Study log.                  |
| **Open Session**                | A Session with no planned time. The timer counts up from 00:00.                                                                                                                                                    |
| **Preset Session**              | A Session with planned time (1 to 600 minutes; the Start menu offers 25, 45, 60 or Custom). The timer counts down.                                                                                                 |
| **Focus mode**                  | The full-screen timer shown while a Session is running. Time big and centered, nothing else competing.                                                                                                             |
| **Overtime**                    | Time past the planned time in a Preset Session. Shown as +mm:ss in apricot. Not a stored state.                                                                                                                    |
| **Add time** (internal: Extend) | Adding more planned time to a Preset Session, from the "+" tool in Focus mode, before or after the countdown ends. Keeps the same Session.                                                                         |
| **Method tag**                  | An optional label on a Session, up to four at once: Lecture notes, Personal notes, Flashcards, Questions.                                                                                                          |
| **Today list**                  | The one list on the Today tab, titled "Today's study". It holds her planned rows and her free starts for today. A row shows a ▶ when no timer is running. Today's Events also appear in it.                        |
| **Planned row**                 | A row in the Today list for a planned Block. Shows the Subject or Topic, its Path, and Progress ("0 of 45 min"). Every Session on that Block rolls into this one row.                                              |
| **Free start**                  | A timer she starts with the Start button without a plan. It can begin with no Subject set. In the Today list it is one row: a live dot while running, then "40 min · 1:00–1:40pm".                                 |
| **Picker**                      | The one control titled "What are you studying?". A search box, then three groups: Planned, Recent, Subjects. A Subject opens a side panel with its Topics. Used in Focus mode, on the end screen and when editing. |
| **Next up**                     | A shortcut on the end screen: the next planned row for today, with a ▶. Shown as a plain row under a hairline, not a pill.                                                                                         |
| **Study log**                   | The on-screen name for her list of past records of study time. Shown per day and per Subject or Topic.                                                                                                             |
| **Link**                        | Internal only. The connection between a Session and a Block (or directly an Event). Never shown on screen.                                                                                                         |
| **Progress**                    | The derived text on a Block, like "35 of 60 min", or total time if the Block has no planned minutes. Not a state.                                                                                                  |
| **Event**                       | A calendar-style item: a mock board, preboard, subject exam or review center exam. Not timed; it can have a start and end time.                                                                                    |
| **Covers**                      | The Subjects and Topics an Event is about.                                                                                                                                                                         |
| **Ready to close**              | The state of an Event whose date (and time, if set) has passed and that she has not closed yet. Shown as a small dot on the Events tab.                                                                            |
| **Close (an Event)**            | The "Mark as done" action on an Event that is ready to close. She adds notes and Marks afterward by editing the Event.                                                                                             |
| **Mark**                        | Either **Confident** or **Review again**, set on a Subject or Topic inside one Event. Lives only on that Event.                                                                                                    |
| **Daily Set**                   | A named group of Lines. One Line from her active Daily Set shows on the Today tab each day.                                                                                                                        |
| **Line**                        | One item in a Daily Set: a verse, quote or note, written as plain text. A verse carries its reference inline, for example "...Jeremiah 29:11".                                                                     |
| **Built-in Set**                | A Daily Set that ships with Tales ("Verses", "Encouragement", "Daily Verse"). Read-only.                                                                                                                           |
| **Active Set**                  | The one Daily Set that feeds the Today tab, shown as "Daily Set shown on Today".                                                                                                                                   |
| **Exam date**                   | The date of her board exam, set by her in Settings › Boards.                                                                                                                                                       |
| **Days to boards**              | The count shown on the Today tab, like "74 days to boards". A fact, never pressure.                                                                                                                                |
| **Today**                       | The first tab and dashboard.                                                                                                                                                                                       |
| **Past 7 days**                 | The dashboard section showing time per day by Subject for the last 7 days.                                                                                                                                         |
| **Archived**                    | A Subject or Topic hidden from pickers but kept in totals and history.                                                                                                                                             |
| **Review center**               | Free-text profile field, like "Cerebro".                                                                                                                                                                           |
| **School**                      | Free-text profile field, like "Cebu Doctors' University".                                                                                                                                                          |

---

## 1. What Tales is and is not

**Tales is** a study planner and timer for medtech board review. She plans study Blocks by Subject and Topic, times each Session, and sees where her hours actually went. It is a utility, not a coach. She opens it, starts a Block and gets on with studying.

**Tales is not:**

- A coach, scorekeeper or nagger. No streaks, no "you're behind", no pace targets.
- A rulebook. No forced equal time, no hard stops, no automatic rollover of unfinished work.
- A general to-do app. It only handles board review study.
- A self-grade. She never has to mark a Subject or Topic as "done".
- A question bank, mock exam app or flashcard app. It works alongside those.
- A social app. Nothing is public. No leaderboards.
- A Notion-style builder. The structure is fixed and light.

**One thing it does better than anything else:** it shows her where her study hours go, by Subject and by Topic, while she plans, so no Subject quietly takes over the day and nothing in her Subjects goes untouched.

---

## 2. Core product principles

1. **Quiet.** No streaks, coins, badges, nudges, push notifications or pace messages. The app never says she is behind.
2. **One tap to study.** Starting any study time takes one tap: ▶ on a planned row, or Start for a free timer. She can choose what she is studying later.
3. **Honest record.** Tales records what she did, not what she planned. She can edit any Session's times afterward.
4. **Hers.** She decides what balanced means. No equal-time rules, no auto-fill, no auto-moving of Blocks.
5. **Flexible.** Blocks can be moved, resized or deleted. Unfinished work stays where she left it. No rollover, no "missed" state.
6. **Facts, not judgments.** Totals, shares and dates are shown plainly. No red, no warnings, no "under" or "over".
7. **Plain words.** Use the words medtech students already use: Boards, Review again, Confident, Mock board, Preboard, Subject exam. No productivity jargon.
8. **Focus on the timer.** In Focus mode the screen is the time and nothing else.
9. **She sticks with it.** Success is her still using it through the whole review period.

**Copy rules (for all UI text):**

- Tone is short, plain and encouraging. Example: "Nice work. 45 min on Blood grouping."
- Days to boards is stated as a fact: "74 days to boards".
- Never use: streak, behind, missed, overdue, late, failed, goal, target, pace, score, grade, unfinished, complete (for Subjects or Topics).
- Never use: syllabus, outline, blueprint, node, JSON.
- Never use on screen: session, link, linked. Her time shows as rows in the Today list and in the Study log. Block appears on the Plan tab only. Everywhere else a planned item is a planned row.
- Use "Review again" and "Confident", never "did bad" or "did well".
- No instructions or rules in the interface (for example, "Count this toward a planned block"). If a control is unclear, change the control. Do not add a line of explanation.
- Buttons use an icon when the icon is clear (Pause, Stop, Play). A word is used when it is not (Start, Save).

---

## 3. Target user

**Primary user:** One medtech board examinee in the Philippines (Cebu) in her review period, using Tales on a laptop. Early in review she studies one Subject a day in depth. Closer to boards she covers many Subjects a day, and that is when balance matters most. She studies from printed review center lecture guides (for example, Cerebro Lecture Guides for the March 2027 MTLE), her own personal notes, and Anki flashcards. She builds her own Subjects and Topics from these. Tales does not connect to Anki or any other tool. She logs that time herself with the Flashcards and Personal notes tags.

**Secondary users:** Other board reviewees, such as her friends, using the same tool with their own login and their own Subjects. This is a bonus, not a goal. Tales is not planned to be public or sold.

**Constraints that follow from the user:**

- Laptop-first. Mobile layout is not part of the MVP.
- Her review materials differ in how deep they go. ISBB has Immunology and Serology plus Blood Banking and Transfusion Medicine, each with named Topics. Clinical Microscopy also has named parts (Urine, Feces and Other Body Fluids, with CSF and Seminal Fluid among the fluids) next to Topics such as Macroscopic Examination, Microscopic Examination and Chemical Analyses. Other Subjects may have no breakdown at all. Tales must handle all of these.
- Review centers give different Exam weight breakdowns. Tales never ships or vouches for any weight numbers.

---

## 4. Core entities

All entities belong to one User. No entity is shared between users in the MVP.

### 4.1 User

| Field         | Type      | Rules                                                               |
| ------------- | --------- | ------------------------------------------------------------------- |
| id            | id        |                                                                     |
| email         | text      | Required, unique, valid email. Kept as a copy; sign-in is Supabase. |
| display name  | text      | Required, 1 to 60 characters.                                       |
| school        | text      | Optional, up to 100 characters.                                     |
| review center | text      | Optional, up to 100 characters.                                     |
| exam date     | date      | Optional.                                                           |
| time zone     | text      | Always set. Default Asia/Manila. Not changeable in the UI.          |
| sound on      | boolean   | Default true. Controls the chime. Set from Focus mode.              |
| theme         | enum      | Light or dark. Also kept in a cookie.                               |
| avatar        | text      | Optional picture URL, uploaded and cropped in Settings.             |
| created at    | timestamp |                                                                     |

Passwords are handled by Supabase auth (email and password, at least 8 characters). Tales stores no password.

### 4.2 Subject / Topic (internal name: Outline Node)

| Field       | Type            | Rules                                                                                                                                                              |
| ----------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| id          | id              |                                                                                                                                                                    |
| parent      | id or null      | Null means this is a Subject. Otherwise a Topic.                                                                                                                   |
| name        | text            | 1 to 200 characters. Unique among siblings (case-insensitive). Cannot contain the character `>`.                                                                   |
| position    | integer         | Order among siblings.                                                                                                                                              |
| exam weight | decimal or null | Optional. 0 to 100, one decimal. The API accepts it on any Subject or Topic; the UI field is in a Topic's detail. Weights do not have to add up to 100.            |
| archived    | boolean         | Default false.                                                                                                                                                     |
| color       | integer         | color_index 0 to 7 from the 8-color Subject palette. Set on the root Subject only; Topics inherit it. Used in charts, the Picker and the Today list. Not editable. |

There is no depth limit.

### 4.3 Study Block

| Field            | Type       | Rules                                                                                                       |
| ---------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| id               | id         |                                                                                                             |
| subject or topic | id         | Required. Any depth, including a Subject itself.                                                            |
| date             | date       | Required.                                                                                                   |
| time of day      | time       | Optional. Places the Block in a time-of-day band on Plan (see 6.3). Sends no reminders.                     |
| planned minutes  | integer    | Optional. 1 to 720. If empty, the Block is open-ended. A Block over 600 min cannot become a Preset Session. |
| position         | integer    | Order within the date.                                                                                      |
| event            | id or null | Optional link to one Event.                                                                                 |

Blocks have no stored state, no close action, no completed flag. Progress is derived from Sessions linked to the Block.

### 4.4 Session

| Field            | Type              | Rules                                                                                                                                                               |
| ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id               | id                |                                                                                                                                                                     |
| subject or topic | id or null        | Any depth, including a Subject itself. May be empty while Running or Paused (free start), and on a Stopped Session until she picks one or discards it (see Flow 6). |
| block            | id or null        | Optional.                                                                                                                                                           |
| event            | id or null        | Optional. Set from the Event tool in Focus mode, or through the Session's Block.                                                                                    |
| started at       | timestamp         | Required.                                                                                                                                                           |
| ended at         | timestamp or null | Null while Running or Paused.                                                                                                                                       |
| state            | derived           | Not stored. Stopped when ended at is set. Paused when it has a pause with no end. Otherwise Running.                                                                |
| planned minutes  | integer or null   | Null for Open Sessions. For Preset Sessions, 1 to 600, the total planned time including Extends.                                                                    |
| pauses           | list of intervals | Separate intervals, each with a start and end. At most one is open per Session. Paused time is not counted.                                                         |
| active time      | derived           | ended at minus started at minus paused time.                                                                                                                        |
| method tags      | list of enum      | Up to 4: Lecture notes, Personal notes, Flashcards, Questions.                                                                                                      |
| note             | text              | Optional, up to 5000 characters.                                                                                                                                    |
| started from     | enum              | Free start, Planned, or Next up. Used for metrics only.                                                                                                             |
| last heartbeat   | timestamp         | On every Session. Updated while the app is open and the Session is Running. Used by Flow 7.                                                                         |

Sessions have no Mark and no rating. A Session belongs to the day it started in her time zone. A user has at most one live (Running or Paused) Session. Sessions cannot overlap, and ended at is after started at. The server lets a Session stop without a Subject or Topic. The end screen then stays until she picks one and saves, or discards the Session.

### 4.5 Event

| Field     | Type                      | Rules                                                                                                                       |
| --------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| id        | id                        |                                                                                                                             |
| title     | text                      | Required, 1 to 100 characters.                                                                                              |
| type      | enum or null              | Optional: Mock board, Preboard, Subject exam, Review center exam. Set through the API only; the UI does not set or show it. |
| date      | date                      | Required.                                                                                                                   |
| time      | time                      | Optional.                                                                                                                   |
| end time  | time                      | Optional. Needs a time. An end earlier than the start rolls to the next day.                                                |
| covers    | list of Subject/Topic ids | Optional, up to 200. Stored in a join table.                                                                                |
| note      | text                      | Optional, up to 5000 characters. Her note about how the Event went.                                                         |
| closed at | timestamp or null         | Null until she closes it.                                                                                                   |
| state     | derived                   | Upcoming, Ready to close or Closed (see section 8).                                                                         |

### 4.6 Event Mark

| Field            | Type | Rules                                                                                                                                               |
| ---------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| event            | id   |                                                                                                                                                     |
| subject or topic | id   | Must be in the Event's Covers, covered by a Block linked to the Event, or studied in a Session tied to the Event. The UI offers the Event's Covers. |
| mark             | enum | Confident or Review again.                                                                                                                          |

One Mark per Subject or Topic per Event. Marks are read only on the Event. They do not change totals, reports, the Subjects tab or the Today tab.

### 4.7 Daily Set and Line

| Entity          | Fields                                                                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Daily Set       | id, name (1 to 60), built-in (boolean), owner (null for Built-in Sets), active (per user, boolean; exactly one is active; with none chosen, Daily Verse is used) |
| Line            | id, set, text (1 to 500, plain text, any reference is part of the text), position, reading date (optional; the seeded daily verse uses it)                       |
| Hidden Line     | user, line. A Line she has hidden. Works on Built-in and own Sets.                                                                                               |
| Daily Line pick | user, date, line (table daily_line_picks). One pick per user per day.                                                                                            |

### 4.8 Relationships

- User has many Subjects (each Subject has many Topics, nested).
- A Block points to one Subject or Topic and optionally one Event.
- A Session points to one Subject or Topic and optionally one Block and one Event.
- An Event covers many Subjects or Topics and has many Marks.
- A Session reaches an Event directly (its event) or through its Block.
- Time rolls up: a Subject's or Topic's total is the sum of Sessions attached to it and to every Topic below it.

---

## 5. Core user flows

Each flow lists steps, then acceptance criteria as checkable conditions.

### Flow 1: Sign up and first look

**Steps**

1. She opens Tales and chooses Sign up.
2. She enters email, password and display name.
3. She sees "Check your email". She can resend the email.
4. She opens the link in the email. It returns her through the auth callback and she lands on the Today tab.

**Acceptance criteria**

- [ ] Sign up requires a valid email, a password of 8 or more characters and a display name.
- [ ] A duplicate email shows "That email already has an account."
- [ ] The "Check your email" screen has a resend option.
- [ ] After confirming she lands on Today, not on a tutorial.
- [ ] A new account has zero Subjects, Blocks, Sessions and Events.
- [ ] If no exam date is set, days to boards is not shown anywhere.
- [ ] Setting an exam date in Settings › Boards shows "N days to boards" on Today.
- [ ] Review center and school are optional and never block sign up.
- [ ] She can reset a forgotten password by email (forgot password, then reset password).

### Flow 2: Build her Subjects

**Steps**

1. She opens the Subjects tab and chooses Add Subject.
2. She types a name and saves.
3. She selects a Subject or Topic and chooses the add button, which then reads "Add under <name>". She saves a name. She repeats for deeper Topics if she wants.
4. She optionally sets an Exam weight on a Topic.
5. She renames, reorders, moves or archives items as needed.

**Acceptance criteria**

- [ ] She can add a Subject with only a name.
- [ ] She can add a Topic under any Subject or Topic. There is no depth limit.
- [ ] A Subject with no Topics is valid and can be used for Blocks and Sessions.
- [ ] A name that already exists under the same parent is rejected with a plain message.
- [ ] A name containing `>` is rejected with a plain message.
- [ ] Exam weight accepts 0 to 100 with one decimal, on a Topic at any depth. Values outside that range are rejected.
- [ ] Exam weight can be left empty, and weights are not required to add up to 100.
- [ ] Each row shows its name, a color swatch (on Subjects) and an archived icon (on archived items). Total time is in the item's detail.
- [ ] She reorders and moves items by dragging them in the tree. Reordering within a parent persists after refresh.
- [ ] Moving a Topic to a different parent is allowed, except under itself or its own child Topics.
- [ ] After a move, rolled-up totals of the old and new parents update.
- [ ] Archiving a Subject or Topic hides it and all items below it from pickers but keeps their time in totals and reports.
- [ ] An archived item can be restored.
- [ ] A Subject or Topic can be deleted only when it has no records or plans (and none below it), after a confirmation. Otherwise she is offered Archive. Hard delete is blocked by the database.
- [ ] A search box filters the tree.
- [ ] The Subjects tab has a Show archived toggle.
- [ ] Opening an item shows its detail: all-time total (or "No time yet"), time in the last 7 days, the split between the item and its Topics below, its Exam weight (Topics only) and its Study log (the records on that item and its Topics).
- [ ] No screen asks her to mark a Subject or Topic as done.

### Flow 3: Plan a day

**Steps**

1. She opens the Plan tab and picks a date (Day view).
2. She chooses Add Block.
3. She picks a Subject or Topic.
4. She optionally sets planned minutes, a time of day, and an Event link.
5. She saves. The Block appears in the Day Plan.
6. She edits a Block to change its planned minutes, time of day or date.

**Acceptance criteria**

- [ ] A Block needs only a Subject or Topic and a date.
- [ ] Planned minutes is optional (1 to 720). Without it the Block is open-ended.
- [ ] Time of day is optional. Blocks are grouped into Morning (before 12:00), Afternoon (12:00 to 17:59), Evening (18:00 on) and Unscheduled, and sorted by time, then by position, inside each band. A Block with no time of day that has study time is placed by when that study first started. A Block with neither is Unscheduled.
- [ ] When a Block has study time, the actual start time shows under its swatch if the Block has no time of day, or if the study started 10 minutes or more away from it. This is a plain fact, never a warning.
- [ ] A Block can be linked to one Event or none.
- [ ] Blocks can be added to past, current and future dates.
- [ ] A Block can be moved to another date by editing it.
- [ ] A Block can be edited or deleted at any time.
- [ ] Deleting a Block with Sessions keeps the Sessions. They become unlinked from any Block.
- [ ] No Block is ever marked missed, late or overdue. There is no automatic rollover.
- [ ] The Plan summary panel shows planned minutes per Subject for the visible day, rolled up from Blocks, next to the time actually studied. Open-ended Blocks add 0 and are shown as "open".
- [ ] The Day view has a Week chart of planned minutes per day, split by Subject. Choosing a day opens it. A Day | Week toggle switches to the Week view, which lists Blocks, Events and study records for Monday to Sunday.
- [ ] A Block, and a study record listed in the Day view, can be opened and edited from Plan.
- [ ] Events on that date appear as small rows. An Event with a time sits among the Blocks by time; one without a time sits at the top of the day. An Event that is ready to close shows a "Mark as done" shortcut that opens it on the Events tab. A Closed Event shows "Done".

### Flow 4: Free start (start now, choose later)

**Steps**

1. From anywhere, she taps Start in the top right of the page content.
2. The timer starts at once and counts up. Focus mode opens. Where the Subject name would be, it reads "What are you studying?".
3. She can tap that line at any time to open the Picker and choose. She can also leave it.
4. She stops. The end screen asks for the Subject or Topic if none is set (Flow 6).

A small arrow next to Start offers 25, 45, 60 or Custom minutes. Choosing one starts a countdown at once instead of a count-up. Custom is a plain number box: she types the minutes and presses Enter, or presses the main Start button, to start.

**Acceptance criteria**

- [ ] Start sits at the top right of the page content, in the same place on Today, Plan, Subjects and Events, except during Focus mode.
- [ ] While a timer is running, a small running bar takes the place of Start (see Flow 6).
- [ ] One tap on Start begins the timer. No question is asked first.
- [ ] A plain tap on Start begins an Open Session, counting up from 00:00.
- [ ] The arrow next to Start offers 25, 45, 60 and Custom (1 to 600 minutes). Choosing a preset begins a Preset Session at once. The presets are only shortcuts; the Session stores its planned minutes.
- [ ] Custom is a number box. Pressing Enter, or the main Start button, begins a Preset Session of the typed length. An empty or out-of-range value does nothing.
- [ ] While no Subject or Topic is set, Focus mode shows "What are you studying?" in its place. It is plain text with a faint underline, so she can tell it is tappable, and it opens the Picker (section 6.10).
- [ ] She can run, pause and extend the timer without ever picking a Subject or Topic.
- [ ] In the Today list, a running free start shows a live dot and "What are you studying?" until she picks.
- [ ] Only one Session can be Running or Paused at a time. If one exists, Start opens it instead of starting another.
- [ ] Starting this way records started from as Free start.

### Flow 5: Play a planned row

**Steps**

1. On Today or Plan she sees a planned row and taps ▶.
2. Focus mode opens with the Subject or Topic already set and the Block linked.
3. She studies, then stops. The end screen may offer Next up (Flow 6).

**Acceptance criteria**

- [ ] One tap on ▶ begins the timer. No other input is required.
- [ ] If the Block has planned minutes and no Sessions yet, the Session is a Preset Session with those minutes.
- [ ] If the Block already has Sessions and remaining planned minutes, the preset defaults to the remaining minutes (for example "35 of 60 min" starts a 25-minute Preset Session).
- [ ] If the Block is open-ended, or Progress has reached or passed its planned minutes, the Session is Open. A Block with more than 600 planned minutes also plays as Open.
- [ ] A Block from an earlier day can be played from the Picker's Planned group, if it has planned minutes and time left. The Session belongs to today and is linked to that Block. On Plan, ▶ shows only on today's Blocks, and only while no timer is running.
- [ ] The Block's Progress updates when the Session stops, and adds up across Sessions (for example "35 of 60 min", then "60 of 60 min").
- [ ] Progress can exceed planned minutes ("75 of 60 min") with no warning or color.
- [ ] Starting from a planned row or from the Picker's Planned group (with no timer running) records started from as Planned.

### Flow 6: Run a study timer in Focus mode

**Steps**

1. Focus mode shows the Subject or Topic name small above the time (or "What are you studying?" if none is set), the time large and centered, and a minimal set of controls.
2. She can Pause, Resume, Stop, toggle the sound, and tap the Subject line to open the Picker.
3. Under Stop and Pause sit small round tools: Method, Note, Event, and, in a Preset Session, Add time ("+").
4. In a Preset Session, at 00:00 a single chime plays and the time turns into Overtime. Nothing else appears and nothing needs an answer.
5. If she wants more time she taps "+" and picks. If not, she keeps going or taps Stop.
6. She stops. The end screen shows what she did, with Subject, Method and a Note field.
7. If she has planned rows left today, the end screen also shows Next up.

**Acceptance criteria**

- [ ] Focus mode shows the time as the largest element and nothing else that competes with it.
- [ ] Focus mode shows the Subject or Topic name, small, with its Path on a second small line, and for Preset Sessions a small "Planned 45:00" line. If none is set it reads "What are you studying?".
- [ ] Tapping the Subject line opens the Picker, whether or not a Subject is set. While the Picker is open the timer dims behind it.
- [ ] The Method, Note and Event tools are round icon buttons directly under Stop and Pause. An icon turns green when it has a value.
- [ ] Method opens a small menu of the four Method tags. She can pick several (up to 4). Choosing a picked one again clears it.
- [ ] Event opens a small menu of her Events. Picking one ties the Session to that Event. Picking it again clears it.
- [ ] Note opens a plain text box under the tools. It is not a floating panel or tooltip. Opening or closing it does not move the time or the controls.
- [ ] Focus mode shows no connection or "linked" wording.
- [ ] Pause holds the clock. Time while Paused is not counted. Resume continues.
- [ ] Open Sessions count up. Preset Sessions count down.
- [ ] At 00:00 in a Preset Session, one chime plays once, if sound is on. It does not repeat.
- [ ] After 00:00 the clock keeps running as Overtime (+03:12) in apricot, and the Session does not stop on its own.
- [ ] Nothing is added to the screen at 00:00. There is no "Time's up" text, no row of buttons and no second Stop. The Session continues in Overtime until she stops it.
- [ ] Add time ("+") is a round tool beside Method and Note. It shows only for Preset Sessions, for the whole countdown and in Overtime. It turns apricot once Overtime begins.
- [ ] Add time opens a small menu: 25 min, 45 min, 60 min and a Custom number box (type minutes, press Enter). Picking one keeps the same Session, starts a new countdown of that length from that moment, and updates planned minutes to active time so far plus the extension.
- [ ] A second chime plays when an extended countdown reaches 00:00.
- [ ] A sound toggle in Focus mode controls the chime and is saved to her profile. Muting stops future chimes. The default is on.
- [ ] The browser tab title shows the time: Open "12:34 · Blood grouping", Preset "24:10 left · Blood grouping", Overtime "+03:12 · Blood grouping", Paused "Paused · Blood grouping". With no Subject set the name part reads "Studying". With no running timer the title is "Tales".
- [ ] Refreshing the page or closing the tab does not stop the Session or change its time. Time is derived from timestamps, not from counting ticks.
- [ ] Changing the Subject or Topic during a Session changes it for the whole Session, including time already counted. To split time between topics she stops and starts again.
- [ ] If the Session is linked to a Block and she picks a Subject or Topic that is the Block's item or sits under it, the link stays. If she picks one outside it, the link is removed. The clock does not change. Picking a different Planned row links the Session to that Block instead.
- [ ] Stop ends the Session and is the only close action.
- [ ] After Stop, the end screen shows, top to bottom: "Nice work", the active time, a labelled Subject (the same plain text as in Focus, opening the Picker), a labelled Event row (only when an Event could fit), a labelled Method row of four chips (several can be on), a labelled Note box, then Discard and Save.
- [ ] Subject and Method start filled in if she already set them during the Session.
- [ ] Stop works without a Subject or Topic, including Stop it at a time from the stale prompt. The end screen then stays, and opens again after a refresh, until she picks a Subject or Topic and saves, or discards. The word "pending" is never shown.
- [ ] The end screen has no separate Block row.
- [ ] A Subject or Topic is required to save. If none is set, Save and Next up are switched off and Discard still works. No explanatory text is shown.
- [ ] Save is a pill button with the word "Save", not an icon.
- [ ] She can discard the study time from the end screen, after a confirmation. Discard is quiet text on the left.
- [ ] There is no Mark, rating or "how did it go" prompt on the end screen.
- [ ] The end screen is a full-screen layer. It scrolls if the window is too short for it.
- [ ] The end screen shows Next up below a hairline, under Save and Discard: a small label, "<Subject or Topic> · <minutes>", and a ▶. It is a plain row, not a pill. It shows when today has at least one other planned row that still has planned time left, or is open-ended with no time yet. It is the first such row in plan order.
- [ ] One tap on Next up saves the study time just ended (it needs a Subject or Topic), then starts the next one as in Flow 5. This records started from as Next up.
- [ ] If no planned row qualifies, Next up does not appear and no empty message is shown.
- [ ] Next up uses today's planned rows only, appears only on the end screen, and can be ignored.
- [ ] Leaving Focus mode (Esc or the minimize control) keeps the Session running and shows a small running bar with the time, the name, Pause and Stop. The bar takes the place of Start at the top right of the content.

### Flow 7: Return to a Session she left running

**Steps**

1. She closes the laptop or leaves with a Session running.
2. She opens Tales again later.
3. Tales asks whether she is still studying and lets her stop it at the right time.

**Acceptance criteria**

- [ ] The open app sends a heartbeat while a Session is Running.
- [ ] On open, if a Session is Running and the last heartbeat is older than 15 minutes, Tales shows "Welcome back. Still studying?" with two choices: Still studying, and Stop it at a time.
- [ ] Still studying continues the Session with no change.
- [ ] Stop it at a time opens a time picker that defaults to the last heartbeat time. The chosen time cannot be before the Session start or after now.
- [ ] Choosing a time stops the Session at that time and opens the end screen.
- [ ] If the heartbeat is recent, no prompt appears.
- [ ] The prompt never appears for a Paused Session. Only a Running Session can be stale.

### Flow 8: Log a past Session by hand

**Steps**

1. From Today or Plan she chooses to log study time.
2. She picks a Subject or Topic, a start and an end, and optionally a Method and a Note.
3. She saves. It appears in the Today list or the Study log like any other.

**Acceptance criteria**

- [ ] A Subject or Topic, a start and an end are required. The end must be after the start.
- [ ] A manual record that would overlap another Session is not saved. The message names the other Session.
- [ ] The end cannot be in the future.
- [ ] A manual record is always recorded as started from Free start. It can still be tied to a Block.
- [ ] It can be edited and deleted like any stopped Session (Flow 9).

### Flow 9: Review and edit a Session

**Steps**

1. She finds it in the Today list, in the Plan Day view, or in a Subject's or Topic's Study log.
2. She opens it and edits its note, method tag, Subject or Topic, or times.

**Acceptance criteria**

- [ ] A stopped Session can be edited at any time.
- [ ] She can change the note, method tags, and Subject or Topic. The Subject or Topic is changed with the Picker. Picking a Planned row there links it to that Block. Picking a Subject or Topic outside the Block's item removes the link (same rule as Flow 6).
- [ ] She can change the start and end time. The end must be after the start.
- [ ] Editing start or end time sets active time to end minus start and clears the Session's pause records. Pauses are not editable in the MVP.
- [ ] An edit that would overlap another Session is not saved. The message names the other Session.
- [ ] She can delete a Session after a confirmation. Totals and Progress update.
- [ ] After any edit, rolled-up totals, Today and Past 7 days reflect the change on next view.

### Flow 10: Create an Event

**Steps**

1. She opens the Events tab and chooses Add Event.
2. She enters a title and a date, and optionally a time, an end time and Covers.
3. She saves.

**Acceptance criteria**

- [ ] Title (1 to 100 characters) and date are required. Time, end time and Covers are optional. The note (up to 5000 characters) is added by editing a Closed Event.
- [ ] The API accepts a type: Mock board, Preboard, Subject exam or Review center exam. The UI does not set or show it.
- [ ] An end time needs a time. An end earlier than the start rolls to the next day.
- [ ] Covers accepts up to 200 Subjects or Topics at any depth.
- [ ] A new Event with a future date or time shows in Upcoming.
- [ ] The Today hero shows the next Upcoming Event.
- [ ] An Event can be created with a past date and shows under Past as Ready to close.
- [ ] An Event can be edited and deleted. Deleting unlinks its Blocks and keeps all Sessions.
- [ ] A Block is linked to an Event from the Block form. A Session is tied to an Event from the Event tool in Focus mode or on the end screen.

### Flow 11: Close an Event and look back at it

**Steps**

1. The Event date (and time, if set) passes. A small dot shows on the Events tab.
2. She opens the Events tab and sees the Event under Past.
3. She opens it and chooses Mark as done. The Event is Closed at once.
4. Later she opens the Closed Event and chooses Edit. She writes a note and optionally marks its Covers as Confident or Review again.
5. She saves. She can edit the note and Marks again whenever she wants.

**Acceptance criteria**

- [ ] An Event with a time becomes Ready to close when that time passes.
- [ ] An Event with only a date becomes Ready to close at the start of the next day.
- [ ] The Events tab shows a dot when at least one Event is Ready to close. The dot has no number, does not grow, does not change color and does not repeat.
- [ ] No notification, email or banner is sent because an Event is Ready to close.
- [ ] The Events tab has two sections: Upcoming and Past. Upcoming is soonest first. Past lists Ready to close Events first, oldest first, then Closed Events, newest first.
- [ ] An Event that is ready to close shows "Mark as done" in its detail, and as a shortcut on its row in Plan and in the Today list. The shortcut opens the Event on the Events tab; it does not close it.
- [ ] Mark as done closes the Event with no note and no Marks, and asks nothing first.
- [ ] The Edit form of a Closed Event has the note and lists the Event's Covers. Each can be set to Confident, Review again, or left with no Mark. A set Mark can be cleared.
- [ ] The server accepts a Mark only on a Subject or Topic in the Event's Covers, in a Block linked to the Event, or in a Session tied to the Event.
- [ ] Marks and notes are visible only on the Event. They do not appear on the Subjects tab, Today or Past 7 days, and they do not change any totals.
- [ ] The Event detail shows: title, date and time, the note and Covers with their Marks (Closed Events), and for a past Event the total time and a list of the study records tied to it, directly or through a Block. The list shows the first 5 with a show-all control.
- [ ] A Closed Event can be edited at any time (note, Marks, Covers, title, date, time). Editing it does not put the dot back.
- [ ] Mark labels read "Confident" and "Review again" everywhere.

### Flow 12: See where hours went

**Steps**

1. She opens Today and sees time by Subject for today and the Past 7 days.
2. She opens Subjects and an item to see its totals.

**Acceptance criteria**

- [ ] Today shows a single bar for today split by Subject, with each Subject's time. When empty it shows "Nothing yet today. Ready when you are."
- [ ] Past 7 days shows one stacked bar per day (last 7 days including today), split by Subject, with a legend.
- [ ] An item's detail on the Subjects tab shows its rolled-up total time, or "No time yet".
- [ ] A Subject or Topic with no Sessions shows "No time yet" in plain neutral text. No warning, no color.
- [ ] Each Subject keeps the same color across every chart.
- [ ] Time for a Session that crosses midnight counts on the day it started.
- [ ] Archived Subjects and Topics still count in all totals and show an "Archived" label.

### Flow 13: Set up her Daily Sets

**Steps**

1. She opens Settings › Daily Sets.
2. She picks the Set shown on Today, hides Lines she does not like, creates her own Set, and adds Lines one by one or pastes many at once.
3. Each day, one Line shows on Today.

**Acceptance criteria**

- [ ] Three Built-in Sets exist for every account: Verses (32 Lines), Encouragement (34 Lines) and Daily Verse (183 Lines, each with a reading date).
- [ ] Built-in Sets are read-only: they cannot be edited or deleted (the server answers 403). Their Lines can be hidden and unhidden by her.
- [ ] She can create, rename and delete her own Sets, and add, edit and delete Lines in them.
- [ ] She can paste many Lines at once into a Set, up to 200,000 characters. One Line per row. The result shows counts: added, skippedEmpty, skippedDuplicate and tooLong.
- [ ] Exactly one Set is active, labelled "Daily Set shown on Today". Choosing another replaces it. A new account has not chosen one, so Daily Verse is the active Set until she does.
- [ ] Today shows one Line, quietly, below the days to boards count, exactly as written.
- [ ] One pick is stored per user per day, so the Line is the same all day, including after a refresh.
- [ ] A Line with a reading date shows on that date (the seeded daily verse). Otherwise a Line is drawn at random from the visible Lines of the active Set, with no repeats until every visible Line has been shown once.
- [ ] If today's Line is hidden or deleted, or its Set is switched off, a new Line is drawn for today.
- [ ] Lines never appear on Focus mode or in any notification.
- [ ] Deleting one of her own Sets removes its Lines and does not affect anything else.

---

## 6. Feature specifications

### 6.1 Navigation and screens

**Layout:** laptop-first web app. A top bar with the Tales logo on the left, the tabs centered, and a profile menu (Settings, Sign out) on the right. Tabs, in order: **Today, Plan, Subjects, Events.** Start sits at the top right of the page content, level with the page title. Focus mode replaces the whole screen while a Session is open. Below about 1000 px wide the tabs sit inline instead of centered, and below 900 px the Today cards stack in one column.

| Screen         | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Today**      | A greeting row with the date and "Today", and Start at its right. Then a grid: the hero card (days to boards, hidden without an exam date, and the next Upcoming Event), today's time by Subject (one bar), the Today list ("Today's study"), and the Past 7 days chart. The Daily Line sits quietly below days to boards.                                                                                                                                                                                                                                                   |
| **Plan**       | A Day                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Week toggle. Day view: Blocks per day, grouped into time-of-day bands, Events as small rows (with a "Mark as done" shortcut when ready to close), the Week chart, and the Plan summary panel (planned minutes per Subject for the visible day, next to time studied). Week view (Monday to Sunday): Blocks, Events, study records and a summary. An add menu offers Plan study and Log study. Blocks and study records can be opened and edited here. |
| **Subjects**   | The tree of Subjects and Topics with expand and collapse, and a search box. Each row: name, a color swatch on Subjects, an archived icon. The add button in the header adds under the selected item ("Add under <name>"), or adds a Subject when nothing is selected. Items are reordered and moved by dragging. Item detail: all-time total, last 7 days, time directly on the item versus in Topics below, Exam weight field (Topics), Study log, and a menu with Rename, Move, Archive or Restore, and Delete (only when the item has no records). Toggle: Show archived. |
| **Events**     | Two sections: Upcoming and Past. Event detail with Mark as done and Edit. Dot on the tab label when an Event is ready to close.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Start**      | Top right of the content. One tap starts a free timer. A small arrow offers 25, 45, 60 or Custom countdowns. Shown on Today, Plan, Subjects and Events. While a timer runs, the running bar replaces it.                                                                                                                                                                                                                                                                                                                                                                     |
| **Picker**     | The "What are you studying?" control. See 6.10.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Focus mode** | See Flow 6.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Settings**   | Profile (display name, school, review center, picture), Boards (exam date), Appearance (light or dark theme), change password, Daily Sets, Delete my account (confirm, removes all her data).                                                                                                                                                                                                                                                                                                                                                                                |

### 6.2 Subjects and Topics

- One tree per user. Subject is the top level. Topics nest under Subjects or other Topics with no depth limit.
- A Subject with named parts is modeled as a Subject with Topics for each part, and those Topics can have their own Topics. ISBB has Immunology and Serology and Blood Banking and Transfusion Medicine, each with Topics. Clinical Microscopy has Urine and Feces and Other Body Fluids (with CSF and Seminal Fluid among the fluids), plus Topics such as Macroscopic Examination. A Subject with no breakdown can stay as a Subject with no Topics. All are equally valid.
- She decides how granular each Subject is. Granularity can differ between Subjects.
- A Block or Session can attach to any item at any depth, including the Subject itself.
- Time rolls up at every level. A Subject's total includes all of its Topics.
- Rename, reorder, move and archive are always available. There is no "complete" action.
- Delete works only on an item with no records or plans; otherwise she archives it.
- The tab has a search box and a Show archived toggle. Item detail shows totals and the item's Study log.
- Color: a root Subject gets a color_index (0 to 7) from the 8-color palette. Topics inherit it.
- Starter content: see open question 1.
- Exam weight is an optional field. The API stores it on any Subject or Topic; the UI field is in a Topic's detail. It is not shown or used anywhere else, including Plan and Reports (see section 10).
- Names: 1 to 200 characters, unique among siblings, no `>` character.

### 6.3 Blocks and Day Plan

- A Day Plan is the ordered list of Blocks on a date. There is no limit on Blocks per day.
- Time of day groups Blocks into bands on Day and Week view (Morning, Afternoon, Evening, Unscheduled) and orders them within a band. It does not trigger reminders.
- On today and past dates, the Day view also lists study time that has no Block, in the band where it started. Week view does not.
- Long Subject and Topic names are truncated in rows and show in full in a tooltip.
- Progress = sum of active time of Sessions linked to the Block. Display: "35 of 60 min" if planned minutes is set, or a total like "1 h 10 min" if open-ended. A Block with no Sessions shows "0 of 60 min" or "0 min".
- A Block never changes state because the date passed. It stays on its date until she moves or deletes it.
- The Day view has the Week chart (planned minutes per day, choosing a day opens it). A separate Week view shows 7 days from Monday with Blocks, Events, study records and a planned-per-Subject summary for the week.
- Plan summary panel shows planned minutes per Subject next to the time studied. It shows no weights, targets or judgments.
- An Event that is ready to close shows a "Mark as done" shortcut on its row. It opens the Event on the Events tab. A Block or a study record can be opened and edited from Plan. ▶ on a Block shows only on today while no timer is running.

### 6.4 Sessions and the timer

- Only one Session can be Running or Paused at a time.
- Start methods: Free start (Start button), or ▶ on a planned row, or Next up. All produce the same Session record.
- A Session may start and stop without a Subject or Topic, but needs one to Save on the end screen. A Block link is optional.
- Open counts up. Preset counts down. A Session's planned minutes is 1 to 600 (a Block can be 1 to 720, so a Block over 600 min plays as Open). The Start menu's 25, 45, 60 and Custom are UI only: Custom is a number box started with Enter or the main Start button.
- At the end of a countdown: one chime (if sound is on) and Overtime begins (apricot). No choice appears. The Add time tool is already there, and Stop is the normal Stop.
- Add time starts a new countdown from the moment it is picked. Planned minutes becomes active time so far plus the extension.
- Sound is unlocked by the Start click, so the chime can play in a background tab where the browser allows. The tab title also shows the time.
- Time is computed from stored timestamps. A reload never changes it.
- The stale Session prompt follows Flow 7.
- Method tags are fixed: Lecture notes, Personal notes, Flashcards, Questions. A Session can carry up to 4. A note and Method tags are optional on every Session.
- Focus mode has an Event tool: a Session can be tied to an Event directly.
- Pauses are separate intervals; a Session has at most one open pause. A user has one live Session, Sessions cannot overlap, and ended is after started.
- If a Session stops without a Subject or Topic, the end screen stays until she picks one and saves, or discards. After a refresh it opens again. No "pending" label is shown.
- The end screen shows Next up when a planned row for today has time left (Flow 6).
- Focus mode details that are not decided yet: what hides when idle, and keyboard shortcuts (section 10). A "Today" timeline reachable from Focus mode was discussed and is deferred.

### 6.5 Events

- Type is optional: Mock board, Preboard, Subject exam, Review center exam. It is set through the API only; the UI does not set or show it.
- Events are not timed. They are dated items with an optional time and an optional end time (needs a time; an earlier end rolls to the next day).
- Title 1 to 100 characters. Note up to 5000. Covers up to 200 Subjects or Topics, stored in a join table.
- State is derived: upcoming, ready_to_close, closed (section 8). The Events tab shows two sections, Upcoming and Past, and a dot when an Event is ready to close. It is passive: a dot only.
- Closing is optional and has no deadline. An Event can stay ready to close forever.
- On the Events tab, Upcoming is soonest first (by date, then time; an Event with no time comes first on its date). Past lists Ready to close Events first (oldest first), then Closed Events (newest first).
- "Mark as done" on a ready-to-close Event closes it at once. The same words appear as a shortcut on its row in Plan and the Today list, where it opens the Event. Notes and Marks are added by editing the Closed Event, which lists its Covers.
- The Today hero shows the next Upcoming Event.
- Marks are Confident or Review again, set per Subject or Topic inside one Event. They exist only on that Event.
- A Block links to at most one Event. A Session reaches an Event directly (its event, set from the Focus mode Event tool) or through its Block.
- A Closed Event is always editable.

### 6.6 Dashboard

- Today and Past 7 days are computed from Sessions. Past 7 days is display only; its bars do not open anything.
- Every figure is a plain total or share of hours. No target, pace or comparison is ever shown.
- "No time yet" is neutral wording, used on the Subjects tab.
- Charts use one stable color per Subject.
- Day boundaries use her profile time zone (default Asia/Manila).
- Time displays as h:mm or minutes. Totals are computed from seconds and rounded only for display.

### 6.7 Daily Sets

- Built-in Sets: Verses (32 Lines; see open question 5), Encouragement (34 Lines) and Daily Verse (183 Lines, each with a reading date). All are read-only.
- A new account has no Set chosen, so Daily Verse is the active Set until she picks another.
- Her own Sets are private to her account.
- Exactly one Set is active, labelled "Daily Set shown on Today".
- Paste-many: one Line per row, up to 200,000 characters. The result shows counts: added, skippedEmpty, skippedDuplicate, tooLong.
- A Line has no separate Source field. A verse carries its reference in the text. A Line can have a reading date; the seeded daily verse uses it.
- One pick is stored per user per day (daily_line_picks).
- Placement is one quiet line on Today below days to boards. Never in Focus mode or notifications.
- Selection and rotation follow Flow 13.
- Daily Set is the working name (open question 6).

### 6.8 Account and settings

- Email and password login (Supabase auth). Sign up has email confirmation: a "Check your email" screen with resend, and the link returns through the auth callback. Forgot password and reset password work by email. Both use Supabase's built-in sender. There is no welcome email.
- Profile: display name, optional school, optional review center, picture (upload and crop), exam date (Settings › Boards). The profile keeps a theme, an avatar URL and a copy of the email. The time zone is fixed at the default, Asia/Manila.
- Theme: light or dark, stored in the profile and in a cookie.
- Settings also has change password, Daily Sets and Delete my account.
- The sound toggle lives in Focus mode and saves to the profile.
- School and review center are free text. No lists are shipped.
- Days to boards: before the exam date shows "N days to boards". On the exam date shows "Boards today". After the date it is hidden.

### 6.9 Today list

- One list on the Today tab, titled "Today's study", for planned rows and free starts. They look the same. Neither shows the words "Session" or "link".
- **Order:** planned rows first, in plan order. Free starts after them, newest first.
- **One row per Block.** Every Session linked to a Block rolls into that Block's planned row. A Block studied twice is still one row.
- **Planned row** shows the Subject or Topic with its Subject color, its Path in small text, and Progress on the right: "0 of 45 min", "40 of 60 min", or "0 min" if open-ended. Once studied, a small second line shows the times in 12-hour format, such as "1:00–1:40pm" (several records are comma-separated, a running one ends in "now"). A Block with a time of day shows it at the left of the row.
- **Free start row** shows the Subject or Topic and Path, and on the right "40 min · 1:00–1:40pm". While running it shows a live dot and the time so far. With no Subject set it shows "What are you studying?" while running, and "What did you study?" once stopped.
- A Block from an earlier day that she plays today does not appear as a planned row on Today. Its time shows today as a studied row, and its Progress updates on its own day in Plan.
- **▶ on a planned row** follows Flow 5. **▶ on a free start row** starts a new Open timer on the same Subject or Topic, with no Block. **While any timer runs**, no row shows a ▶, and the running row cannot be tapped.
- Today's Events also appear in the list: an Event without a time first, an Event with a time among the planned rows by time, each with the "Mark as done" shortcut when ready to close.
- The card header has an add menu with Plan study and Log study.
- Tapping a row with study time (not the ▶) opens that record for editing (Flow 9). A row with several records first asks which one. The edit dialog has the Picker for the Subject or Topic, Method chips, a Note, start and end times, and Delete (with confirmation).
- Empty state: "Nothing yet today. Ready when you are."

### 6.10 Picker ("What are you studying?")

- **Shape:** a small floating panel with a search box at the top, focused when it opens, and one short list below it. It stays quiet: one line per row, a Subject color swatch, the name, and Progress on the right where it applies.
- **Planned:** today's planned rows first, with Progress. Then planned Blocks from the six days before today that have planned minutes and still have time left (open-ended Blocks are left out), each tagged with "Yesterday" or its date. Earlier days do not have a separate entry.
- **Recent:** her recently used Subjects and Topics, up to three, with their Path in small text. Anything already shown under Planned is left out.
- **Subjects:** only the top-level Subjects, each with a chevron. Hovering or clicking one opens a single side panel beside the Picker with that Subject's Topics, indented by level, to any depth. Parent Topics are in semibold. Clicking a Topic picks it. Clicking the Subject row itself picks the Subject. There is no "All of" row.
- **Searching:** typing in the box replaces the list with flat results in two groups, Planned and Subjects and topics, each with its Path. The side panel closes.
- **Narrow windows:** where the side panel does not fit beside the Picker, it replaces the list and has a small "Subjects" back row. Clicking a Subject opens its Topics instead of picking it.
- Archived Subjects and Topics do not appear.
- **Where it opens:** Focus mode (tap the Subject line), the end screen (the Subject text), and when editing a study record. In Focus mode the timer dims to a quarter while it is open.
- **Picking a Planned row** sets the Subject or Topic from that Block and links the Session to it. If a timer is already running, the clock does not change.
- **Picking from Recent or Subjects** sets the Subject or Topic. The link rule in Flow 6 applies.
- The Picker never creates a Subject or Topic. Adding them happens on the Subjects tab.

### 6.11 Visual design

- Tokens live in `src/styles/tokens.css` and are described in `docs/design-system.md`.
- In short: flat, pastel sage ground, one deep-green card per screen, DM Sans, large soft numerals for time, circular icon buttons, hairline borders. Only focus rings and the avatar crop use shadow.
- Light and dark themes. Dark mode follows the saved theme cookie. A first visit is light; there is no default from the OS preference.
- Overtime is apricot. A muted red exists for system messages only (a failed save, a confirm to delete). It never appears on study time, Subjects or Progress.

---

## 7. Roles and permissions

There is one role: **Student.** There is no admin role in the app.

| Action                                            | Student (own data) | Student (other users' data) | Signed out |
| ------------------------------------------------- | ------------------ | --------------------------- | ---------- |
| Sign up, sign in, reset password                  | n/a                | n/a                         | Yes        |
| Create, edit, archive, delete Subjects and Topics | Yes                | No                          | No         |
| Create, edit, delete Blocks                       | Yes                | No                          | No         |
| Start, pause, stop, edit, delete Sessions         | Yes                | No                          | No         |
| Create, edit, close, reopen-edit, delete Events   | Yes                | No                          | No         |
| Read Today, Plan, Subjects                        | Yes                | No                          | No         |
| Create, edit, delete own Daily Sets and Lines     | Yes                | No                          | No         |
| Edit or delete Built-in Sets                      | No                 | No                          | No         |
| Hide Built-in Lines, choose the active Set        | Yes                | No                          | No         |
| Change profile and settings, delete own account   | Yes                | No                          | No         |

Rules:

- Every read and write is limited to the signed-in user's own data. Every API route needs a signed-in user, except the sign-in callback, sign-out, the API docs and the OpenAPI file.
- Nothing is public. No sharing between accounts in the MVP.
- Maintenance by the developer happens outside the app and is not a role in the product.

---

## 8. System states

### Session

State is derived from timestamps and pause records. It is not stored.

| State   | Meaning            | Moves to         |
| ------- | ------------------ | ---------------- |
| Running | Clock is counting. | Paused, Stopped  |
| Paused  | Clock is held.     | Running, Stopped |
| Stopped | Ended. Editable.   | (edit only)      |

Overtime is a display condition of a Running or Paused Preset Session whose planned time has passed. It is not a state.

A Session with no Subject or Topic can be Running, Paused or Stopped. Stopped without one, the end screen stays until she picks a Subject or Topic and saves, or discards.

### Event

| State          | Rule                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Upcoming       | Date (and time) has not passed.                                                                     |
| Ready to close | Date (and time) has passed and she has not closed it. Shown as a dot on the Events tab, under Past. |
| Closed         | She closed it. Always editable. Editing does not return it to Ready to close.                       |

### Subject / Topic

| State    | Rule                                                         |
| -------- | ------------------------------------------------------------ |
| Active   | Appears in pickers and the tree.                             |
| Archived | Hidden from pickers. Kept in totals and reports. Restorable. |

There is no "complete", "done" or "mastered" state.

### Block

No stored state. Display variants only:

- No Sessions: "0 min" or "0 of 60 min".
- With Sessions: "35 of 60 min" or a total.
- Over plan: "75 of 60 min", shown plainly.

There is no missed, late, overdue or unfinished state.

### Daily Set and Line

| Entity    | States                                                          |
| --------- | --------------------------------------------------------------- |
| Daily Set | Active (exactly one per user) or inactive. Built-in or her own. |
| Line      | Visible or hidden (per user).                                   |

### Exam date

| State         | Display                   |
| ------------- | ------------------------- |
| Not set       | Days to boards is hidden. |
| In the future | "N days to boards".       |
| Today         | "Boards today".           |
| Passed        | Hidden.                   |

### Account

Signed out, or signed in. A new account must confirm its email first.

---

## 9. Platform and data notes

- Web app. Laptop-first, in current Chrome, Edge, Safari and Firefox. Mobile layout is not part of the MVP.
- Stack: Next 16, React 19, Drizzle, Supabase (email and password), TanStack Query, zustand, zod 4, dnd-kit, Vitest.
- Data is stored per account on the server. No offline mode in the MVP.
- Timestamps are timestamptz, shown in the user's time zone (default Asia/Manila). A "day" is a calendar day in that zone. A week starts on Monday.
- The timer is derived from stored start time, pauses and end time, never from counting ticks.
- No third-party analytics, ads or tracking. Metrics in section 11 come from SQL on the app's own tables.
- Authentication: Supabase email and password, with email confirmation at sign up and reset by email.

---

## 10. Deferred to post-MVP (explicitly out of scope)

**Export and import of Subjects and Daily Sets** _(Post-MVP, specified here so the data model fits it)_

- File type: **Excel (.xlsx)**. **.csv** is accepted on import as a fallback. JSON is never shown to the user.
- One .xlsx file carries two sheets: **Subjects** and **Sets**.
- **Subjects sheet** columns: **Path** (required, like `ISBB > Blood Banking > Blood grouping`), **Exam weight** (optional, a number from 0 to 100), **Archived** (optional, "Yes" or empty).
  - One row per Subject or Topic, at any depth. **Exam weight applies to every row**, so Subjects, Topics and sub-Topics all carry their weights.
  - Rows can be in any order. If a parent Path is missing, it is created automatically.
- **Sets sheet** columns: **Set** (required), **Line** (required). Only her own Sets are exported. Built-in Sets are not.
- Not included in the export: Blocks, Sessions, Events, Marks, Templates, hours. Sharing Subjects with a friend must not carry her study history.
- Import rules:
  - Import only adds. It never deletes or overwrites.
  - Anything that already exists (same Path, or same Set and Line) is skipped.
  - If an existing Subject or Topic has no Exam weight and the file has one, the weight is filled in. If she already has a weight, hers is kept.
  - She sees a preview first ("12 Subjects and Topics to add, 3 skipped") and confirms.
  - Problems are listed in plain words ("Row 14: Path is empty"). A bad row never blocks good rows.
  - A blank template with one example row on each sheet is downloadable.
- Excel was chosen because she and her friends already use Excel or Google Sheets, and because .csv often garbles accents and the letter ñ.

**Other post-MVP items**

- Showing Exam weight next to hours in Reports and in the Plan summary panel (as a plain reference, off by default, never a target).
- Auto-drafted study days. A possible later step: "Suggest a week from my weights", drafting Blocks she can accept or delete, only when she asks.
- Review passes or rounds.
- Planned vs. actual comparison in Reports.
- Saving a past free start as a planned Block.
- A "Today" timeline in Focus mode: a small sheet listing what she has studied today. Discussed on Oct 19 and deferred.
- Optional dashboard sections beyond days to boards, Today and Past 7 days.
- Focus mode details: what hides when idle, keyboard shortcuts.
- Reports by Method tag.
- A full personal backup export (Blocks, Sessions, Events, everything).
- Sharing a Daily Set with another account.
- Showing a Line on any schedule other than daily.
- Mobile layout and offline use.
- Push notifications or email reminders of any kind.
- Editing pause records inside a Session.
- Any question bank, quiz, flashcard or spaced-repetition feature.

---

## 11. Success metrics

There is no analytics in the app. Metrics come from SQL on the existing tables. None of them measure pace or hours against a target. All targets below are _(provisional)_.

| Metric                  | How it is measured                                                                                                                       | Target                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Still using it          | At least one Session in week 4 and in week 8 after her first Session.                                                                    | Primary user: yes at both. Secondary users: at least half. |
| Easy starts             | Share of timers started from a planned row's play button or from Next up (started from = Planned or Next up).                            | At least 60%.                                              |
| Timer trust             | Reports of a lost or wrongly timed Session.                                                                                              | Zero.                                                      |
| It showed her something | Every two weeks she is asked: "Did Tales show you anything you wouldn't have noticed?" This is a manual check-in, not an in-app feature. | A yes in at least 2 of the first 4 check-ins.              |

Not measured on purpose: streaks, daily hour targets, number of Blocks completed, share of Subjects touched. The weekly look-back and the stale-prompt rate are not measurable today (see section 13).

---

## 12. Open questions

1. **Starter Subjects.** Not decided. The MVP has no import, so she would type her Subjects by hand. Options: Lysander seeds her account once, or Tales ships a starter list she can edit. Her review materials (CRPDC, Padayon Notes, Cerebro) break Subjects down differently, so a shipped list may not fit.
2. **Logging a past Session.** Decided and built: she can add a Session by hand (Flow 8).
3. **Stale Session threshold.** Decided: 15 minutes without a heartbeat.
4. **Focus mode idle behavior.** Still open. The Overtime color is decided (apricot).
5. **Bible translation for the Verses Set.** The daily verse text appears to be WEB. To confirm.
6. **Name for a group of Lines.** Decided: "Daily Set" stays the working name.
7. **How friends get accounts.** Decided: open sign up.
8. **Exam weight display.** Decided: the weight is stored and editable, not displayed.
9. **Subject list and weights accuracy.** Tales never ships weights. Any weights she enters come from her review center and are hers to keep correct.
10. **On-screen name for the history list.** Decided: "Study log".
11. **Picking a Planned row while a timer is already running.** The Session links to that Block but the clock does not change. Revisit if she expects the countdown to start.
12. **The Change control on a planned row (Flow 5).** Not built. Decide whether it stays (see section 13).
13. **Subject colors.** The palette has 8 colors (color_index 0 to 7). Only two are settled (ISBB lilac, Clinical Microscopy butter). The other six are proposed.
14. **Picker on a touch screen.** The side panel is built for hover. Revisit when a mobile layout is planned.

---

## 13. Planned (not yet live)

Everything here is specified but has no UI yet. Original text is kept so nothing is lost. Where an API exists it is noted.

### 13.1 Reports

The Reports tab is disabled. The API exists (`/api/reports`); there is no page.

**Original spec (Flow 12, reports half, with 6.1 and 6.6):**

- She opens Reports to pick a range and look closer.
- Reports offers ranges: Last 7 days (default), Last 30 days, This week, Custom, All time.
- Reports shows total time, time per Subject with share of total hours, and a stacked day-by-day chart.
- Clicking a Subject in Reports shows its Topics the same way, down to any depth.
- Reports lists Subjects and Topics with no time in the range under "No time yet in this range".
- Reports shows no target line, no pace, no comparison with Exam weight, and no comparison with planned time.
- Screen: range picker, total time, time per Subject with share, day-by-day stacked chart, drill into a Subject's Topics, "No time yet in this range" list.
- The Reports API reads the same Session and Subject data and the same day boundaries as Today. "No time yet" is also used in Reports.

### 13.2 Copy day, Repeat, Save as template, Apply template

The APIs exist; there is no UI. The original numbering of this flow (Flow 4) and of the Template entity (4.7) was removed from the live body when it was renumbered; the items below are labelled by name.

**Template entity:**

| Field | Type | Rules                                                                                        |
| ----- | ---- | -------------------------------------------------------------------------------------------- |
| id    | id   |                                                                                              |
| name  | text | 1 to 60 characters.                                                                          |
| items | list | Each has a Subject or Topic, optional time of day, optional planned minutes, and a position. |

**Glossary:** Template: a saved Day Plan shape she can apply to any date.

**Copy, repeat and reuse a day (flow)**

Steps

1. On a day with Blocks, she chooses Copy day.
2. She picks one or more target dates and confirms.
3. Or she chooses Repeat, picks days of the week and an end date, and confirms.
4. Or she chooses Save as template, names it, and later uses Apply template on any date.

Acceptance criteria

- [ ] Copy day creates new independent Blocks on each chosen date, with the same Subject or Topic, time of day and planned minutes.
- [ ] Copied Blocks do not carry Sessions or Event links.
- [ ] If a target date already has Blocks, the copies are added after them. Nothing is replaced or removed.
- [ ] Repeat requires at least one weekday and an end date.
- [ ] Before confirming, Repeat and Copy show how many Blocks will be added (for example, "This will add 18 Blocks").
- [ ] Blocks made by Copy, Repeat or Apply template are ordinary Blocks. Editing one does not change the others.
- [ ] Save as template stores the day's Subjects or Topics, times of day, planned minutes and order.
- [ ] Apply template adds Blocks to the chosen date. It never removes existing Blocks.
- [ ] Templates can be renamed and deleted. Deleting a Template does not affect Blocks already made from it.
- [ ] An archived Subject or Topic in a Template or copy still creates the Block, and the Block shows the item as archived.
- A new account has zero Templates. Templates are created, edited and deleted by the Student (permissions table).

### 13.3 Day-view drag-reorder of Blocks

The API exists; there is no UI.

- Flow 3, step 6: She drags Blocks to reorder them or edits planned minutes to resize.
- [ ] Dragging reorders Blocks and the order persists after refresh.
- Plan: Blocks per day with drag to reorder and move. Week view drag moves a Block to another date.

### 13.4 Settings

- **Time zone control.** Original: "time zone: defaults from the browser. Changeable." Today the time zone is fixed at the default, Asia/Manila, and the profile column is non-null.
- **Sound toggle in Settings.** Original: "A sound toggle in Focus mode and in settings controls the same setting." Today the toggle lives only in Focus mode and saves to the profile.

### 13.5 Past 7 days: open a day

- Clicking a day in Past 7 days opens that day's Study log.
- Flow 9, step 1: she finds a record in a day's Study log from Past 7 days.

### 13.6 "Set your exam date" prompt on Today

- Flow 1, step 4: She sees a prompt to set her exam date (skippable) and an empty Subjects tab with an Add Subject button.
- Today the date is set in Settings › Boards. The hero is hidden without a date.

### 13.7 Events list with three groups

- Original: "The Events tab lists Ready to close first, then Upcoming (soonest first), then Closed (newest first)." Lists: Ready to close, Upcoming, Closed.
- Today the tab has two sections, Upcoming and Past, with a dot on the tab for ready to close.

### 13.8 More than one active Daily Set

- Original: "She can switch any Set Active or inactive. Several can be Active at once. If none are Active, no Line shows." Both Built-in Sets were Active by default for a new account.
- Lines were drawn at random from the visible Lines of all Active Sets.
- Today exactly one Set is active.

### 13.9 Subjects Import and Export

The Subjects header has Import and Export buttons that only say "coming soon". The full spec is in section 10.

### 13.10 Open items kept from the original spec

- **Change control on a planned row** (Flow 5): "A small Change control lets her switch between Open and a preset before or right after starting." Open question 12.
- **Focus mode idle behavior.** Open question 4.
- **Picker on a touch screen.** Open question 14.

### 13.11 Measurement plan

- **Weekly look-back:** she opens Past 7 days (Today or Reports) at least once in a week. Target: in at least 80% of weeks since sign up. Needs event tracking; not measurable today.
- **Stale-prompt rate:** stale-Session prompts on fewer than 10% of Sessions. Needs the prompt to be recorded; not measurable today.

### 13.12 Smaller items the UI does not have yet

- **Last studied.** The date of the latest Session on a Subject or Topic (including its child Topics). The Subjects API returns it. Original: each Subjects row shows its rolled-up total time and Last studied (or "No time yet"). Today the item detail shows the total, and no screen shows Last studied.
- **Exam weight on a Subject.** The API accepts it on a Subject. The UI field is only in a Topic's detail.
- **Event type.** Original: Add Event offers a type (Mock board, Preboard, Subject exam, Review center exam) and the Event detail shows it. The API stores it; the UI neither sets nor shows it.
- **Close screen.** Original: choosing Close opens a screen where she writes optional notes and marks the Event's Covers plus the Subjects and Topics of Blocks linked to it. Today "Mark as done" closes at once, and notes and Marks are added by editing the Closed Event, which lists only its Covers.
- **Event detail extras.** Original: the Event detail lists its linked Blocks, with total time through those Blocks by Subject or Topic, and a Block can be linked from the Event's detail. Today a Block is linked from the Block form.
- **Event note on create.** Today the note field appears only when editing a Closed Event.
