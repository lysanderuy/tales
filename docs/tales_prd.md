# Tales: Product Requirements Document

**Status:** Draft v0.5
**Date:** Oct 24, 2026
**Owner:** Lysander
**Inputs:** tales_brief.md, tales_competitors.md, design discussion on Oct 18 and 19, 2026, the settled HTML prototype (core-flow.html), the design files (tales_design.yaml, tales_tokens.css), and photos of two review center lecture guides (CRPDC Immunology and Serology / Blood Banking; Padayon Notes Clinical Microscopy; Cerebro Lecture Guides for the March 2027 MTLE).

**What changed in v0.5:** this file now lives in the repo and is aligned with what is built. Subject and Topic names allow up to 200 characters. A Session's state is derived, not stored. She can log a past Session by hand. Plan groups Blocks into time-of-day bands. A Block that was started off its planned time shows when it actually started. Truncated Subject and Topic names show in full in a tooltip. Email confirmation at sign up is on, with no welcome email.

**What changed in v0.4:** the Today layout (centered tabs, Start at the top right of the content), the Picker (search first, Subjects open a side panel), the Focus mode tools (Method and Note under the controls, note in a plain box), the end screen (labelled sections, a Save button, Next up as a plain row), the Custom countdown (type a number and press Enter), and a correction: Clinical Microscopy does have a breakdown. The Overtime color is decided. The "Time's up" choice in Focus mode is replaced by an Add time ("+") tool.

**How to use this document:** It is written to feed user stories, architecture docs and screen mockups. The terms in the glossary are fixed. Use them exactly as written. Anything marked _(Post-MVP)_ is out of scope for the first build. Anything marked _(provisional)_ is a default that can still change. Open items are listed in section 12.

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
| **Template**                    | A saved Day Plan shape she can apply to any date.                                                                                                                                                                  |
| **Session**                     | Internal name for a record of time she actually studied: a Subject or Topic, a start, an end, and optional note and method tag. Never shown on screen. Her list of past records is the Study log.                  |
| **Open Session**                | A Session with no planned time. The timer counts up from 00:00.                                                                                                                                                    |
| **Preset Session**              | A Session with planned time (25, 45, 60 or custom minutes). The timer counts down.                                                                                                                                 |
| **Focus mode**                  | The full-screen timer shown while a Session is running. Time big and centered, nothing else competing.                                                                                                             |
| **Overtime**                    | Time past the planned time in a Preset Session. Shown as +mm:ss in apricot. Not a stored state.                                                                                                                    |
| **Add time** (internal: Extend) | Adding more planned time to a Preset Session, from the "+" tool in Focus mode, before or after the countdown ends. Keeps the same Session.                                                                         |
| **Method tag**                  | An optional label on a Session: Lecture notes, Personal notes, Flashcards or Questions.                                                                                                                            |
| **Today list**                  | The one list on the Today tab, titled "Today's study". It holds her planned rows and her free starts for today. Every row has a ▶.                                                                                 |
| **Planned row**                 | A row in the Today list for a planned Block. Shows the Subject or Topic, its Path, and Progress ("0 of 45 min"). Every Session on that Block rolls into this one row.                                              |
| **Free start**                  | A timer she starts with the Start button without a plan. It can begin with no Subject set. In the Today list it is one row: a live dot while running, then "40 min · 13:00–13:40".                                 |
| **Picker**                      | The one control titled "What are you studying?". A search box, then three groups: Planned, Recent, Subjects. A Subject opens a side panel with its Topics. Used in Focus mode, on the end screen and when editing. |
| **Next up**                     | A shortcut on the end screen: the next planned row for today, with a ▶. Shown as a plain row under a hairline, not a pill.                                                                                         |
| **Study log**                   | The on-screen name for her list of past records of study time. Shown per day and per Subject or Topic.                                                                                                             |
| **Link**                        | Internal only. The connection between a Session and a Block. Never shown on screen.                                                                                                                                |
| **Progress**                    | The derived text on a Block, like "35 of 60 min", or total time if the Block has no planned minutes. Not a state.                                                                                                  |
| **Event**                       | A calendar-style item: a Mock board, Preboard, Subject exam or Review center exam. Not timed.                                                                                                                      |
| **Covers**                      | The Subjects and Topics an Event is about.                                                                                                                                                                         |
| **Ready to close**              | The state of an Event whose date (and time, if set) has passed and that she has not closed yet. Shown as a small dot on the Events tab.                                                                            |
| **Close (an Event)**            | The action where she adds notes and marks for an Event.                                                                                                                                                            |
| **Mark**                        | Either **Confident** or **Review again**, set on a Subject or Topic inside one Event. Lives only on that Event.                                                                                                    |
| **Daily Set**                   | A named group of Lines. One Line from her active Daily Sets shows on the Today tab each day.                                                                                                                       |
| **Line**                        | One item in a Daily Set: a verse, quote or note, written as plain text. A verse carries its reference inline, for example "...Jeremiah 29:11".                                                                     |
| **Built-in Set**                | A Daily Set that ships with Tales ("Verses", "Encouragement"). Read-only.                                                                                                                                          |
| **Active Set**                  | A Daily Set she has switched on to feed the Today tab.                                                                                                                                                             |
| **Exam date**                   | The date of her board exam, set by her in settings.                                                                                                                                                                |
| **Days to boards**              | The count shown on the Today tab, like "74 days to boards". A fact, never pressure.                                                                                                                                |
| **Today**                       | The first tab and dashboard.                                                                                                                                                                                       |
| **Past 7 days**                 | The dashboard section showing time per day by Subject for the last 7 days.                                                                                                                                         |
| **Last studied**                | The date of the latest Session on a Subject or Topic (including its child Topics).                                                                                                                                 |
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

| Field         | Type      | Rules                                  |
| ------------- | --------- | -------------------------------------- |
| id            | id        |                                        |
| email         | text      | Required, unique, valid email.         |
| password      | hash      | At least 8 characters.                 |
| display name  | text      | Required, 1 to 60 characters.          |
| school        | text      | Optional, up to 100 characters.        |
| review center | text      | Optional, up to 100 characters.        |
| exam date     | date      | Optional.                              |
| time zone     | text      | Defaults from the browser. Changeable. |
| sound on      | boolean   | Default true. Controls the chime.      |
| created at    | timestamp |                                        |

### 4.2 Subject / Topic (internal name: Outline Node)

| Field       | Type            | Rules                                                                                                                                                                          |
| ----------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| id          | id              |                                                                                                                                                                                |
| parent      | id or null      | Null means this is a Subject. Otherwise a Topic.                                                                                                                               |
| name        | text            | 1 to 200 characters. Unique among siblings (case-insensitive). Cannot contain the character `>`.                                                                               |
| position    | integer         | Order among siblings.                                                                                                                                                          |
| exam weight | decimal or null | Optional. 0 to 100, one decimal. Allowed on any Subject or Topic at any depth. Weights do not have to add up to 100.                                                           |
| archived    | boolean         | Default false.                                                                                                                                                                 |
| color       | text            | Auto-assigned per Subject from the Tales Subject palette (see tales_design.yaml), inherited by its Topics. Used in charts, the Picker and the Today list. Not editable in MVP. |

Depth is unlimited. The UI must support at least 6 levels.

### 4.3 Study Block

| Field            | Type       | Rules                                                                                   |
| ---------------- | ---------- | --------------------------------------------------------------------------------------- |
| id               | id         |                                                                                         |
| subject or topic | id         | Required. Any depth, including a Subject itself.                                        |
| date             | date       | Required.                                                                               |
| time of day      | time       | Optional. Places the Block in a time-of-day band on Plan (see 6.3). Sends no reminders. |
| planned minutes  | integer    | Optional. 1 to 720. If empty, the Block is open-ended.                                  |
| position         | integer    | Order within the date.                                                                  |
| event            | id or null | Optional link to one Event.                                                             |

Blocks have no stored state, no close action, no completed flag. Progress is derived from Sessions linked to the Block.

### 4.4 Session

| Field            | Type              | Rules                                                                                                                                      |
| ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| id               | id                |                                                                                                                                            |
| subject or topic | id or null        | Any depth, including a Subject itself. May be empty while Running or Paused (free start). Required before the Session is saved as Stopped. |
| block            | id or null        | Optional.                                                                                                                                  |
| started at       | timestamp         | Required.                                                                                                                                  |
| ended at         | timestamp or null | Null while Running or Paused.                                                                                                              |
| state            | derived           | Not stored. Stopped when ended at is set. Paused when it has a pause with no end. Otherwise Running.                                       |
| planned minutes  | integer or null   | Null for Open Sessions. For Preset Sessions, the total planned time including Extends.                                                     |
| pauses           | list of intervals | Each has a start and end. Paused time is not counted.                                                                                      |
| active time      | derived           | ended at minus started at minus paused time.                                                                                               |
| method tag       | enum or null      | Lecture notes, Personal notes, Flashcards, Questions.                                                                                      |
| note             | text              | Optional, up to 5000 characters.                                                                                                           |
| started from     | enum              | Free start, Planned, or Next up. Used for metrics only.                                                                                    |
| last heartbeat   | timestamp         | Updated while the app is open and the Session is Running. Used by Flow 8.                                                                  |

Sessions have no Mark and no rating. A Session belongs to the day it started in her time zone.

### 4.5 Event

| Field     | Type                      | Rules                                                               |
| --------- | ------------------------- | ------------------------------------------------------------------- |
| id        | id                        |                                                                     |
| title     | text                      | Required, 1 to 100 characters.                                      |
| type      | enum                      | Mock board, Preboard, Subject exam, Review center exam.             |
| date      | date                      | Required.                                                           |
| time      | time                      | Optional.                                                           |
| covers    | list of Subject/Topic ids | Optional.                                                           |
| note      | text                      | Optional, up to 5000 characters. Her note about how the Event went. |
| closed at | timestamp or null         | Null until she closes it.                                           |

### 4.6 Event Mark

| Field            | Type | Rules                                                                    |
| ---------------- | ---- | ------------------------------------------------------------------------ |
| event            | id   |                                                                          |
| subject or topic | id   | Must be in the Event's Covers or covered by a Block linked to the Event. |
| mark             | enum | Confident or Review again.                                               |

One Mark per Subject or Topic per Event. Marks are read only on the Event. They do not change totals, reports, the Subjects tab or the Today tab.

### 4.7 Template

| Field | Type | Rules                                                                                        |
| ----- | ---- | -------------------------------------------------------------------------------------------- |
| id    | id   |                                                                                              |
| name  | text | 1 to 60 characters.                                                                          |
| items | list | Each has a Subject or Topic, optional time of day, optional planned minutes, and a position. |

### 4.8 Daily Set and Line

| Entity      | Fields                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Daily Set   | id, name (1 to 60), built-in (boolean), owner (null for Built-in Sets), active (per user, boolean) |
| Line        | id, set, text (1 to 500, plain text, any reference is part of the text), position                  |
| Hidden Line | user, line. A Line she has hidden. Works on Built-in and own Sets.                                 |
| Daily Line  | user, date, line. The Line chosen for that day.                                                    |

### 4.9 Relationships

- User has many Subjects (each Subject has many Topics, nested).
- A Block points to one Subject or Topic and optionally one Event.
- A Session points to one Subject or Topic and optionally one Block.
- An Event covers many Subjects or Topics and has many Marks.
- Sessions reach an Event only through their Block.
- Time rolls up: a Subject's or Topic's total is the sum of Sessions attached to it and to every Topic below it.

---

## 5. Core user flows

Each flow lists steps, then acceptance criteria as checkable conditions.

### Flow 1: Sign up and first look

**Steps**

1. She opens Tales and chooses Sign up.
2. She enters email, password and display name.
3. She lands on the Today tab.
4. She sees a prompt to set her exam date (skippable) and an empty Subjects tab with an Add Subject button.

**Acceptance criteria**

- [ ] Sign up requires a valid email, a password of 8 or more characters and a display name.
- [ ] A duplicate email shows "That email already has an account."
- [ ] After sign up she lands on Today, not on a tutorial.
- [ ] A new account has zero Subjects, Blocks, Sessions, Events and Templates.
- [ ] A new account has both Built-in Sets and both are Active.
- [ ] If no exam date is set, days to boards is not shown anywhere.
- [ ] Setting an exam date in settings shows "N days to boards" on Today.
- [ ] Review center and school are optional and never block sign up.

### Flow 2: Build her Subjects

**Steps**

1. She opens the Subjects tab and chooses Add Subject.
2. She types a name and saves.
3. On a Subject she chooses Add Topic and saves a name. She repeats for deeper Topics if she wants.
4. She optionally sets an Exam weight on any Subject or Topic.
5. She renames, reorders, moves or archives items as needed.

**Acceptance criteria**

- [ ] She can add a Subject with only a name.
- [ ] She can add a Topic under any Subject or Topic, at least 6 levels deep.
- [ ] A Subject with no Topics is valid and can be used for Blocks and Sessions.
- [ ] A name that already exists under the same parent is rejected with a plain message.
- [ ] A name containing `>` is rejected with a plain message.
- [ ] Exam weight accepts 0 to 100 with one decimal, on a Subject or a Topic at any depth. Values outside that range are rejected.
- [ ] Exam weight can be left empty, and weights are not required to add up to 100.
- [ ] Each row shows its rolled-up total time and its Last studied date.
- [ ] Reordering within a parent persists after refresh.
- [ ] Moving a Topic to a different parent is allowed, except under itself or its own child Topics.
- [ ] After a move, rolled-up totals of the old and new parents update.
- [ ] Archiving a Subject or Topic hides it and all items below it from pickers but keeps their time in totals and reports.
- [ ] An archived item can be restored.
- [ ] An item with attached Sessions or Blocks cannot be deleted. She is offered Archive instead.
- [ ] An item with no Sessions or Blocks (and no children with them) can be deleted after a confirmation.
- [ ] No screen asks her to mark a Subject or Topic as done.

### Flow 3: Plan a day

**Steps**

1. She opens the Plan tab and picks a date (Day view).
2. She chooses Add Block.
3. She picks a Subject or Topic.
4. She optionally sets planned minutes, a time of day, and an Event link.
5. She saves. The Block appears in the Day Plan.
6. She drags Blocks to reorder them or edits planned minutes to resize.

**Acceptance criteria**

- [ ] A Block needs only a Subject or Topic and a date.
- [ ] Planned minutes is optional (1 to 720). Without it the Block is open-ended.
- [ ] Time of day is optional. Blocks are grouped into Morning (before 12:00), Afternoon (12:00 to 17:59), Evening (18:00 on) and Unscheduled, and sorted by time, then by position, inside each band. A Block with no time of day that has study time is placed by when that study first started. A Block with neither is Unscheduled.
- [ ] When a Block has study time, the actual start time shows under its swatch if the Block has no time of day, or if the study started 10 minutes or more away from it. This is a plain fact, never a warning.
- [ ] A Block can be linked to one Event or none.
- [ ] Blocks can be added to past, current and future dates.
- [ ] Dragging reorders Blocks and the order persists after refresh.
- [ ] A Block can be moved to another date (Day view date change or Week view drag).
- [ ] A Block can be edited or deleted at any time.
- [ ] Deleting a Block with Sessions keeps the Sessions. They become unlinked from any Block.
- [ ] No Block is ever marked missed, late or overdue. There is no automatic rollover.
- [ ] The Plan summary panel shows planned minutes per Subject for the visible day, rolled up from Blocks. Open-ended Blocks add 0 and are shown as "open".
- [ ] Events on that date appear as a small row at the top of the day.

### Flow 4: Copy, repeat and reuse a day

**Steps**

1. On a day with Blocks, she chooses Copy day.
2. She picks one or more target dates and confirms.
3. Or she chooses Repeat, picks days of the week and an end date, and confirms.
4. Or she chooses Save as template, names it, and later uses Apply template on any date.

**Acceptance criteria**

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

### Flow 5: Free start (start now, choose later)

**Steps**

1. From anywhere, she taps Start in the top right of the page content.
2. The timer starts at once and counts up. Focus mode opens. Where the Subject name would be, it reads "What are you studying?".
3. She can tap that line at any time to open the Picker and choose. She can also leave it.
4. She stops. The end screen asks for the Subject or Topic if none is set (Flow 7).

A small arrow next to Start offers 25, 45, 60 or Custom minutes. Choosing one starts a countdown at once instead of a count-up. Custom is a plain number box: she types the minutes and presses Enter to start. There is no separate button.

**Acceptance criteria**

- [ ] Start sits at the top right of the page content, in the same place on every tab, except during Focus mode.
- [ ] While a timer is running, a small running bar takes the place of Start (see Flow 7).
- [ ] One tap on Start begins the timer. No question is asked first.
- [ ] A plain tap on Start begins an Open Session, counting up from 00:00.
- [ ] The arrow next to Start offers 25, 45, 60 and Custom (1 to 600 minutes). Choosing a preset begins a Preset Session at once.
- [ ] Custom is a number box with no button. Pressing Enter begins a Preset Session of that length. An empty or out-of-range value does nothing.
- [ ] While no Subject or Topic is set, Focus mode shows "What are you studying?" in its place. It is plain text with a faint underline, so she can tell it is tappable, and it opens the Picker (section 6.10).
- [ ] She can run, pause and extend the timer without ever picking a Subject or Topic.
- [ ] In the Today list, a running free start shows a live dot and "What are you studying?" until she picks.
- [ ] Only one Session can be Running or Paused at a time. If one exists, Start opens it instead of starting another.
- [ ] Starting this way records started from as Free start.

### Flow 6: Play a planned row

**Steps**

1. On Today or Plan she sees a planned row and taps ▶.
2. Focus mode opens with the Subject or Topic already set and the Block linked.
3. She studies, then stops. The end screen may offer Next up (Flow 7).

**Acceptance criteria**

- [ ] One tap on ▶ begins the timer. No other input is required.
- [ ] If the Block has planned minutes and no Sessions yet, the Session is a Preset Session with those minutes.
- [ ] If the Block already has Sessions and remaining planned minutes, the preset defaults to the remaining minutes (for example "35 of 60 min" starts a 25-minute Preset Session).
- [ ] If the Block is open-ended, or Progress has reached or passed its planned minutes, the Session is Open.
- [ ] A small Change control lets her switch between Open and a preset before or right after starting. _(provisional: not in the prototype yet)_
- [ ] Past Blocks can be played from the Picker's Planned group or from the Plan tab. The Session belongs to today and is linked to that Block.
- [ ] The Block's Progress updates when the Session stops, and adds up across Sessions (for example "35 of 60 min", then "60 of 60 min").
- [ ] Progress can exceed planned minutes ("75 of 60 min") with no warning or color.
- [ ] Starting from a planned row or from the Picker's Planned group (with no timer running) records started from as Planned.

### Flow 7: Run a study timer in Focus mode

**Steps**

1. Focus mode shows the Subject or Topic name small above the time (or "What are you studying?" if none is set), the time large and centered, and a minimal set of controls.
2. She can Pause, Resume, Stop, toggle the sound, and tap the Subject line to open the Picker.
3. Under Stop and Pause sit small round tools: Method, Note, and, in a Preset Session, Add time ("+").
4. In a Preset Session, at 00:00 a single chime plays and the time turns into Overtime. Nothing else appears and nothing needs an answer.
5. If she wants more time she taps "+" and picks. If not, she keeps going or taps Stop.
6. She stops. The end screen shows what she did, with Subject, Method and a Note field.
7. If she has planned rows left today, the end screen also shows Next up.

**Acceptance criteria**

- [ ] Focus mode shows the time as the largest element and nothing else that competes with it.
- [ ] Focus mode shows the Subject or Topic name, small, with its Path on a second small line, and for Preset Sessions a small "Planned 45:00" line. If none is set it reads "What are you studying?".
- [ ] Tapping the Subject line opens the Picker, whether or not a Subject is set. While the Picker is open the timer dims behind it.
- [ ] The Method and Note tools are round icon buttons directly under Stop and Pause. An icon turns green when it has a value.
- [ ] Method opens a small menu of the four Method tags. Choosing the same one again clears it.
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
- [ ] A sound toggle in Focus mode and in settings controls the same setting. Muting stops future chimes. The default is on.
- [ ] The browser tab title shows the time: Open "12:34 · Blood grouping", Preset "24:10 left · Blood grouping", Overtime "+03:12 · Blood grouping", Paused "Paused · Blood grouping". With no Subject set the name part reads "Studying". With no running timer the title is "Tales".
- [ ] Refreshing the page or closing the tab does not stop the Session or change its time. Time is derived from timestamps, not from counting ticks.
- [ ] Changing the Subject or Topic during a Session changes it for the whole Session, including time already counted. To split time between topics she stops and starts again.
- [ ] If the Session is linked to a Block and she picks a Subject or Topic that is the Block's item or sits under it, the link stays. If she picks one outside it, the link is removed. The clock does not change. Picking a different Planned row links the Session to that Block instead.
- [ ] Stop ends the Session and is the only close action.
- [ ] After Stop, the end screen shows, top to bottom: "Nice work", the active time, a labelled Subject (the same plain text as in Focus, opening the Picker), a labelled Method row of four chips, a labelled Note box, then Discard and Save.
- [ ] Subject and Method start filled in if she already set them during the Session.
- [ ] The end screen has no separate Block row.
- [ ] A Subject or Topic is required to save. If none is set, Save is switched off. No explanatory text is shown.
- [ ] Save is a pill button with the word "Save", not an icon.
- [ ] She can discard the study time from the end screen, after a confirmation. Discard is quiet text on the left.
- [ ] There is no Mark, rating or "how did it go" prompt on the end screen.
- [ ] The end screen fits on a laptop screen without scrolling.
- [ ] The end screen shows Next up below a hairline, under Save and Discard: a small label, "<Subject or Topic> · <minutes>", and a ▶. It is a plain row, not a pill. It shows when today has at least one other planned row that still has planned time left, or is open-ended with no time yet. It is the first such row in plan order.
- [ ] One tap on Next up saves the study time just ended (it needs a Subject or Topic), then starts the next one as in Flow 6. This records started from as Next up.
- [ ] If no planned row qualifies, Next up does not appear and no empty message is shown.
- [ ] Next up uses today's planned rows only, appears only on the end screen, and can be ignored.
- [ ] Leaving Focus mode (Esc or the minimize control) keeps the Session running and shows a small running bar with the time, the name, Pause and Stop. The bar takes the place of Start at the top right of the content.

### Flow 8: Return to a Session she left running

**Steps**

1. She closes the laptop or leaves with a Session running.
2. She opens Tales again later.
3. Tales asks whether she is still studying and lets her stop it at the right time.

**Acceptance criteria**

- [ ] The open app sends a heartbeat while a Session is Running.
- [ ] On open, if a Session is Running and the last heartbeat is older than 15 minutes _(provisional)_, Tales shows "Welcome back. Still studying?" with two choices: Still studying, and Stop it at a time.
- [ ] Still studying continues the Session with no change.
- [ ] Stop it at a time opens a time picker that defaults to the last heartbeat time. The chosen time cannot be before the Session start or after now.
- [ ] Choosing a time stops the Session at that time and saves it.
- [ ] If the heartbeat is recent, no prompt appears.
- [ ] The prompt never appears for a Paused Session.

### Flow 9a: Log a past Session by hand

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

1. She finds it in the Today list, in a day's Study log from Past 7 days, or in a Subject's or Topic's Study log.
2. She opens it and edits its note, method tag, Subject or Topic, or times.

**Acceptance criteria**

- [ ] A stopped Session can be edited at any time.
- [ ] She can change the note, method tag, and Subject or Topic. The Subject or Topic is changed with the Picker. Picking a Planned row there links it to that Block. Picking a Subject or Topic outside the Block's item removes the link (same rule as Flow 7).
- [ ] She can change the start and end time. The end must be after the start.
- [ ] Editing start or end time sets active time to end minus start and clears the Session's pause records. Pauses are not editable in the MVP.
- [ ] An edit that would overlap another Session is not saved. The message names the other Session.
- [ ] She can delete a Session after a confirmation. Totals and Progress update.
- [ ] After any edit, rolled-up totals, Today, Past 7 days and Reports reflect the change on next view.

### Flow 10: Create an Event

**Steps**

1. She opens the Events tab and chooses Add Event.
2. She enters a title, a type, a date, and optionally a time, Covers and a note.
3. She saves.

**Acceptance criteria**

- [ ] Title, type and date are required. Time, Covers and note are optional.
- [ ] Type is one of Mock board, Preboard, Subject exam, Review center exam.
- [ ] Covers accepts any number of Subjects or Topics at any depth.
- [ ] A new Event with a future date or time shows in Upcoming.
- [ ] An Event can be created with a past date and shows as Ready to close.
- [ ] An Event can be edited and deleted. Deleting unlinks its Blocks and keeps all Sessions.
- [ ] A Block can be linked to an Event from the Block form or from the Event's detail.

### Flow 11: Close an Event and look back at it

**Steps**

1. The Event date (and time, if set) passes. A small dot shows on the Events tab.
2. She opens the Events tab and sees the Event under Ready to close.
3. She opens it and chooses Close.
4. She writes optional notes and optionally marks Subjects and Topics as Confident or Review again.
5. She saves. The Event moves to Closed.
6. Later she opens a Closed Event to see her notes and marks, and edits them if she wants.

**Acceptance criteria**

- [ ] An Event with a time becomes Ready to close when that time passes.
- [ ] An Event with only a date becomes Ready to close at the start of the next day.
- [ ] The Events tab shows a dot when at least one Event is Ready to close. The dot has no number, does not grow, does not change color and does not repeat.
- [ ] No notification, email or banner is sent because an Event is Ready to close.
- [ ] The Events tab lists Ready to close first, then Upcoming (soonest first), then Closed (newest first).
- [ ] The Close screen lists the Event's Covers plus the Subjects and Topics of Blocks linked to the Event.
- [ ] Each listed item can be set to Confident, Review again, or left with no Mark. A set Mark can be cleared.
- [ ] An Event can be closed with no notes and no Marks.
- [ ] Marks and notes are visible only on the Event. They do not appear on the Subjects tab, Today, Past 7 days or Reports, and they do not change any totals.
- [ ] The Event detail shows: title, type, date and time, Covers, linked Blocks, total Session time through those Blocks (by Subject or Topic), the note, and the Marks.
- [ ] A Closed Event can be edited at any time (notes, Marks, Covers, type, date). Editing it does not put the dot back.
- [ ] Mark labels read "Confident" and "Review again" everywhere.

### Flow 12: See where hours went

**Steps**

1. She opens Today and sees time by Subject for today and the Past 7 days.
2. She opens Subjects to see totals and Last studied per item.
3. She opens Reports to pick a range and look closer.

**Acceptance criteria**

- [ ] Today shows a single bar for today split by Subject, with each Subject's time. When empty it shows "Nothing yet today. Ready when you are."
- [ ] Past 7 days shows one stacked bar per day (last 7 days including today), split by Subject, with a legend.
- [ ] Clicking a day in Past 7 days opens that day's Study log.
- [ ] The Subjects tab shows, for every Subject and Topic, rolled-up total time and Last studied (or "No time yet").
- [ ] A Subject or Topic with no Sessions shows "No time yet" in plain neutral text. No warning, no color.
- [ ] Reports offers ranges: Last 7 days (default), Last 30 days, This week, Custom, All time.
- [ ] Reports shows total time, time per Subject with share of total hours, and a stacked day-by-day chart.
- [ ] Clicking a Subject in Reports shows its Topics the same way, down to any depth.
- [ ] Reports lists Subjects and Topics with no time in the range under "No time yet in this range".
- [ ] Reports shows no target line, no pace, no comparison with Exam weight, and no comparison with planned time.
- [ ] Each Subject keeps the same color across every chart.
- [ ] Time for a Session that crosses midnight counts on the day it started.
- [ ] Archived Subjects and Topics still count in all totals and reports and show an "Archived" label.

### Flow 13: Set up her Daily Sets

**Steps**

1. She opens Settings › Daily Sets.
2. She switches Sets on or off, hides Lines she does not like, creates her own Set, and adds Lines one by one or pastes many at once.
3. Each day, one Line shows on Today.

**Acceptance criteria**

- [ ] Two Built-in Sets exist for every account: Verses and Encouragement. Both are Active by default.
- [ ] Built-in Sets cannot be edited or deleted. Their Lines can be hidden and unhidden by her.
- [ ] She can create, rename and delete her own Sets, and add, edit and delete Lines in them.
- [ ] She can paste many Lines at once into a Set. One Line per row. Empty rows and duplicates within the Set are skipped. A count is shown before she confirms.
- [ ] She can switch any Set Active or inactive. Several can be Active at once. If none are Active, no Line shows.
- [ ] Today shows one Line, quietly, below the days to boards count, exactly as written.
- [ ] The Line is the same all day, including after a refresh.
- [ ] Lines are drawn at random from the visible Lines of all Active Sets, with no repeats until every visible Line has been shown once. Then the cycle starts again.
- [ ] If today's Line is hidden or deleted, or its Set is switched off, a new Line is drawn for today.
- [ ] Lines never appear on Focus mode, in reports, or in any notification.
- [ ] Deleting one of her own Sets removes its Lines and does not affect anything else.

---

## 6. Feature specifications

### 6.1 Navigation and screens

**Layout:** laptop-first web app. A top bar with the Tales logo on the left, the tabs centered, and a profile menu (Settings, Sign out) on the right. Tabs, in order: **Today, Plan, Subjects, Events, Reports.** Start sits at the top right of the page content, level with the page title. Focus mode replaces the whole screen while a Session is open. Below about 1000 px wide the tabs sit inline instead of centered, and below 900 px the Today cards stack in one column.

| Screen         | Contents                                                                                                                                                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Today**      | A greeting row with the date and "Today", and Start at its right. Then a grid: days to boards (the one deep-green card, if exam date set), today's time by Subject (one bar), the Today list ("Today's study"), and the Past 7 days chart. The Daily Line sits quietly below days to boards.                             |
| **Plan**       | Day view and Week view (Monday to Sunday). Blocks per day with drag to reorder and move. Events as a small row on their dates. Plan summary panel (planned minutes per Subject for the visible day or week). Copy day, Repeat, Save as template, Apply template.                                                         |
| **Subjects**   | The tree of Subjects and Topics with expand and collapse. Each row: name, rolled-up total time, Last studied. Row actions: Add Topic, Rename, Move, Archive, Delete. Item detail: totals (all time, last 7 days), time directly on the item versus in Topics below, Exam weight field, Study log. Toggle: Show archived. |
| **Events**     | Lists: Ready to close, Upcoming, Closed. Event detail and Close screen. Dot on the tab label when needed.                                                                                                                                                                                                                |
| **Reports**    | Range picker. Total time. Time per Subject with share. Day-by-day stacked chart. Drill into a Subject's Topics. "No time yet in this range" list.                                                                                                                                                                        |
| **Start**      | Top right of the content. One tap starts a free timer. A small arrow offers 25, 45, 60 or Custom countdowns. While a timer runs, the running bar replaces it.                                                                                                                                                            |
| **Picker**     | The "What are you studying?" control. See 6.10.                                                                                                                                                                                                                                                                          |
| **Focus mode** | See Flow 7.                                                                                                                                                                                                                                                                                                              |
| **Settings**   | Account (display name, email, password, school, review center, exam date, time zone, sound). Daily Sets. Delete my account (confirm, removes all her data).                                                                                                                                                              |

### 6.2 Subjects and Topics

- One tree per user. Subject is the top level. Topics nest under Subjects or other Topics with no depth limit.
- A Subject with named parts is modeled as a Subject with Topics for each part, and those Topics can have their own Topics. ISBB has Immunology and Serology and Blood Banking and Transfusion Medicine, each with Topics. Clinical Microscopy has Urine and Feces and Other Body Fluids (with CSF and Seminal Fluid among the fluids), plus Topics such as Macroscopic Examination. A Subject with no breakdown can stay as a Subject with no Topics. All are equally valid.
- She decides how granular each Subject is. Granularity can differ between Subjects.
- A Block or Session can attach to any item at any depth, including the Subject itself.
- Time rolls up at every level. A Subject's total includes all of its Topics.
- Rename, reorder, move and archive are always available. There is no "complete" action.
- Starter content: see open question 1.
- Exam weight is an optional field on any Subject or Topic. In the MVP it is stored and editable in the item detail. It is not shown in Plan or Reports (see section 10).
- Names: 1 to 200 characters, unique among siblings, no `>` character.

### 6.3 Blocks and Day Plan

- A Day Plan is the ordered list of Blocks on a date. There is no limit on Blocks per day.
- Time of day groups Blocks into bands on Day and Week view (Morning, Afternoon, Evening, Unscheduled) and orders them within a band. It does not trigger reminders.
- On today and past dates, the Day view also lists study time that has no Block, in the band where it started. Week view does not.
- Long Subject and Topic names are truncated in rows and show in full in a tooltip.
- Progress = sum of active time of Sessions linked to the Block. Display: "35 of 60 min" if planned minutes is set, or a total like "1 h 10 min" if open-ended. A Block with no Sessions shows "0 of 60 min" or "0 min".
- A Block never changes state because the date passed. It stays on its date until she moves or deletes it.
- Week view shows 7 days from Monday. It shows Blocks, Events and a planned-per-Subject summary for the week.
- Plan summary panel counts planned minutes only. It shows no weights, targets or judgments.
- Copy, Repeat and Apply template follow Flow 4. Repeat needs weekdays and an end date and creates ordinary Blocks.

### 6.4 Sessions and the timer

- Only one Session can be Running or Paused at a time.
- Start methods: Free start (Start button), or ▶ on a planned row, or Next up. All produce the same Session record.
- A Session may start without a Subject or Topic, but needs one before it is saved. A Block link is optional.
- Open counts up. Preset counts down. Presets are 25, 45, 60 or a custom value from 1 to 600 minutes, typed into a number box and started with Enter.
- At the end of a countdown: one chime (if sound is on) and Overtime begins (apricot). No choice appears. The Add time tool is already there, and Stop is the normal Stop.
- Add time starts a new countdown from the moment it is picked. Planned minutes becomes active time so far plus the extension.
- Sound is unlocked by the Start click, so the chime can play in a background tab where the browser allows. The tab title also shows the time.
- Time is computed from stored timestamps. A reload never changes it.
- The stale Session prompt follows Flow 8.
- Method tags are fixed in the MVP: Lecture notes, Personal notes, Flashcards, Questions. A note and a method tag are optional on every Session.
- Focus mode details that are not decided yet: what hides when idle, and keyboard shortcuts (section 10). A "Today" timeline reachable from Focus mode was discussed and is deferred.

### 6.5 Events

- Types: Mock board, Preboard, Subject exam, Review center exam.
- Events are not timed. They are dated items with an optional time.
- Ready to close follows Flow 11. It is passive: a dot only.
- Closing is optional and has no deadline. An Event can stay Ready to close forever.
- Marks are Confident or Review again, set per Subject or Topic inside one Event. They exist only on that Event.
- A Block links to at most one Event. A Session reaches an Event only through its Block.
- A Closed Event is always editable.

### 6.6 Dashboard and reports

- Today and Past 7 days use the same data as Reports.
- Every figure is a plain total or share of hours. No target, pace or comparison is ever shown.
- "No time yet" is neutral wording, used on the Subjects tab and in Reports.
- Charts use one stable color per Subject.
- Day boundaries use the time zone in her settings.
- Time displays as h:mm or minutes. Totals are computed from seconds and rounded only for display.

### 6.7 Daily Sets

- Built-in Sets: Verses (public-domain translation, see open question 5) and Encouragement (original lines written for Tales). Each ships with at least 30 Lines _(provisional)_.
- Her own Sets are private to her account.
- Paste-many format: one Line per row.
- A Line has no separate Source field. A verse carries its reference in the text.
- Placement is one quiet line on Today below days to boards. Never in Focus mode, reports or notifications.
- Selection and rotation follow Flow 13.
- Daily Set is the working name (open question 6).

### 6.8 Account and settings

- Email and password login with email confirmation at sign up and password reset by email. Both use Supabase's built-in sender. There is no welcome email.
- Profile: display name, optional school, optional review center, exam date, time zone.
- Settings: sound on or off, Daily Sets, Delete my account.
- School and review center are free text. No lists are shipped.
- Days to boards: before the exam date shows "N days to boards". On the exam date shows "Boards today". After the date it is hidden.

### 6.9 Today list

- One list on the Today tab, titled "Today's study", for planned rows and free starts. They look the same. Neither shows the words "Session" or "link".
- **Order:** planned rows first, in plan order. Free starts after them, newest first.
- **One row per Block.** Every Session linked to a Block rolls into that Block's planned row. A Block studied twice is still one row.
- **Planned row** shows the Subject or Topic with its Subject color, its Path in small text, and Progress on the right: "0 of 45 min", "40 of 60 min", or "0 min" if open-ended. Once studied, a small second line shows the times: "13:00–13:40".
- **Free start row** shows the Subject or Topic and Path, and on the right "40 min · 13:00–13:40". While running it shows a live dot and the time so far. With no Subject set it shows "What are you studying?".
- A Block from an earlier day that she plays today does not appear as a planned row on Today. Its time shows today as a studied row, and its Progress updates on its own day in Plan.
- **▶ on a planned row** follows Flow 6. **▶ on a free start row** starts a new Open timer on the same Subject or Topic, with no Block. **On the running row** there is no ▶. Tapping the row opens Focus mode.
- Tapping a row (not the ▶) opens it for editing (Flow 9). The edit dialog has the Picker for the Subject or Topic, Method chips, a Note, start and end times, and Delete (with confirmation).
- Empty state: "Nothing yet today. Ready when you are."

### 6.10 Picker ("What are you studying?")

- **Shape:** a small floating panel with a search box at the top, focused when it opens, and one short list below it. It stays quiet: one line per row, a Subject color swatch, the name, and Progress on the right where it applies.
- **Planned:** today's planned rows first, with Progress. Then planned Blocks from the last 7 days that still have time left, each tagged with "Yesterday" or its date. Earlier days do not have a separate entry.
- **Recent:** her recently used Subjects and Topics, up to three, with their Path in small text. Anything already shown under Planned is left out.
- **Subjects:** only the top-level Subjects, each with a chevron. Hovering or clicking one opens a single side panel beside the Picker with that Subject's Topics, indented by level, to any depth. Parent Topics are in semibold. Clicking a Topic picks it. Clicking the Subject row itself picks the Subject. There is no "All of" row.
- **Searching:** typing in the box replaces the list with flat results in two groups, Planned and Subjects and topics, each with its Path. The side panel closes.
- **Narrow windows:** where the side panel does not fit beside the Picker, it replaces the list and has a small "Subjects" back row. Clicking a Subject opens its Topics instead of picking it.
- Archived Subjects and Topics do not appear.
- **Where it opens:** Focus mode (tap the Subject line), the end screen (the Subject text), and when editing a study record. In Focus mode the timer dims to a quarter while it is open.
- **Picking a Planned row** sets the Subject or Topic from that Block and links the Session to it. If a timer is already running, the clock does not change.
- **Picking from Recent or Subjects** sets the Subject or Topic. The link rule in Flow 7 applies.
- The Picker never creates a Subject or Topic. Adding them happens on the Subjects tab.

### 6.11 Visual design

- Visual rules and tokens live in `tales_design.yaml` and `tales_tokens.css`. The settled reference is the `core-flow.html` prototype.
- In short: flat (no shadows), pastel sage ground, one deep-green card per screen, DM Sans, large soft numerals for time, circular icon buttons, hairline borders, light and dark themes.
- Overtime is apricot. A muted red exists for system messages only (a failed save, a confirm to delete). It never appears on study time, Subjects or Progress.

---

## 7. Roles and permissions

There is one role: **Student.** There is no admin role in the app.

| Action                                            | Student (own data) | Student (other users' data) | Signed out |
| ------------------------------------------------- | ------------------ | --------------------------- | ---------- |
| Sign up, sign in, reset password                  | n/a                | n/a                         | Yes        |
| Create, edit, archive, delete Subjects and Topics | Yes                | No                          | No         |
| Create, edit, delete Blocks, Templates            | Yes                | No                          | No         |
| Start, pause, stop, edit, delete Sessions         | Yes                | No                          | No         |
| Create, edit, close, reopen-edit, delete Events   | Yes                | No                          | No         |
| Read Reports, Today, Subjects                     | Yes                | No                          | No         |
| Create, edit, delete own Daily Sets and Lines     | Yes                | No                          | No         |
| Edit or delete Built-in Sets                      | No                 | No                          | No         |
| Hide Built-in Lines, switch Sets on or off        | Yes                | No                          | No         |
| Change profile and settings, delete own account   | Yes                | No                          | No         |

Rules:

- Every read and write is limited to the signed-in user's own data.
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

A Session with no Subject or Topic can be Running or Paused, but cannot be saved as Stopped.

### Event

| State          | Rule                                                                                    |
| -------------- | --------------------------------------------------------------------------------------- |
| Upcoming       | Date (and time) has not passed.                                                         |
| Ready to close | Date (and time) has passed and she has not closed it. Shown as a dot on the Events tab. |
| Closed         | She closed it. Always editable. Editing does not return it to Ready to close.           |

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

| Entity    | States                                              |
| --------- | --------------------------------------------------- |
| Daily Set | Active or inactive (per user). Built-in or her own. |
| Line      | Visible or hidden (per user).                       |

### Exam date

| State         | Display                   |
| ------------- | ------------------------- |
| Not set       | Days to boards is hidden. |
| In the future | "N days to boards".       |
| Today         | "Boards today".           |
| Passed        | Hidden.                   |

### Account

Signed out, or signed in. No other states in the MVP.

---

## 9. Platform and data notes

- Web app. Laptop-first, in current Chrome, Edge, Safari and Firefox. Mobile layout is not part of the MVP.
- Data is stored per account on the server. No offline mode in the MVP.
- Times are stored in UTC and displayed in the user's time zone. A "day" is a calendar day in that zone. A week starts on Monday.
- The timer is derived from stored start time, pauses and end time, never from counting ticks.
- No third-party analytics, ads or tracking. Metrics in section 11 come from the app's own data.
- Authentication: email and password, hashed, with email confirmation at sign up and reset by email.

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

Tales is quiet by design, so none of these measure pace or hours against a target. All targets below are _(provisional)_.

| Metric                  | How it is measured                                                                                                                       | Target                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Still using it          | At least one Session in week 4 and in week 8 after her first Session.                                                                    | Primary user: yes at both. Secondary users: at least half. |
| Weekly look-back        | She opens Past 7 days (Today or Reports) at least once in a week.                                                                        | In at least 80% of weeks since sign up.                    |
| Easy starts             | Share of timers started from a planned row's ▶ or from Next up (started from = Planned or Next up).                                      | At least 60%.                                              |
| Timer trust             | Reports of a lost or wrongly timed Session.                                                                                              | Zero. Stale-Session prompts on fewer than 10% of Sessions. |
| It showed her something | Every two weeks she is asked: "Did Tales show you anything you wouldn't have noticed?" This is a manual check-in, not an in-app feature. | A yes in at least 2 of the first 4 check-ins.              |

Not measured on purpose: streaks, daily hour targets, number of Blocks completed, share of Subjects touched.

---

## 12. Open questions

1. **Starter Subjects.** Not decided. The MVP has no import, so she would type her Subjects by hand. Options: Lysander seeds her account once, or Tales ships a starter list she can edit. Her review materials (CRPDC, Padayon Notes, Cerebro) break Subjects down differently, so a shipped list may not fit.
2. **Logging a past Session.** Decided: she can add a Session by hand (Flow 9a).
3. **Stale Session threshold.** 15 minutes without a heartbeat is the default.
4. **Focus mode idle behavior.** Still open. The Overtime color is decided (apricot).
5. **Bible translation for the Verses Set.** A public-domain translation (KJV or WEB) is assumed.
6. **Name for a group of Lines.** "Daily Set" is the working name.
7. **How friends get accounts.** Open sign up, or invite only. The MVP assumes a sign-up page.
8. **Exam weight display.** The field is in the MVP. Its display in Plan and Reports is post-MVP.
9. **Subject list and weights accuracy.** Tales never ships weights. Any weights she enters come from her review center and are hers to keep correct.
10. **On-screen name for the history list.** "Study log" is the working name.
11. **Picking a Planned row while a timer is already running.** The Session links to that Block but the clock does not change. Revisit if she expects the countdown to start.
12. **The Change control on a planned row (Flow 6).** In the PRD but not in the prototype. Decide whether it stays.
13. **Subject colors.** Only two are settled (ISBB lilac, Clinical Microscopy butter). The other six in the palette are proposed.
14. **Picker on a touch screen.** The side panel is built for hover. Revisit when a mobile layout is planned.
