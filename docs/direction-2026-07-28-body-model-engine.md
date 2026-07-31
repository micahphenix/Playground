# Steward — Direction Note: From Tracker to Body Model Engine

_Captured from a voice coaching session · July 28, 2026_
_Author: conversation between Micah and Claude · Intended reader: Claude Code (deep design pass)_

---

## TL;DR

Micah's live use of Claude as a coach surfaced the product Steward is *supposed* to be. Today Steward is largely a calorie + protein tracker. The direction: make it a **holistic body-model engine** that treats every input (food logs, daily weight, Garmin workouts/sleep, periodic DEXA scans) as data flowing into a single running model of the user's body over time — and returns goal-relative insight, not just totals.

This is a restatement of the original "memory is the product" north star, sharpened into a concrete computational spine: **back-calculate maintenance from real data, and model body-composition trajectory across point-in-time scans.**

---

## The trigger

Micah is starting a cut. Currently ~190 lb, wants to lean out while minimizing muscle loss. A prior cut (a couple months back) didn't lose much — he wants to go a bit deeper or add aerobic work to speed it up, and get "a little healthier overall."

### Coaching decisions reached this session (also relevant as product logic)

1. **Add cardio volume rather than cut calories deeper.** Hold calories at the existing cut target (~2,100–2,200); pull the extra deficit from added Zone 2 rides. This protects muscle and doubles as 50-mile aerobic base-building.
2. **Two added easy Zone 2 rides/week**, 45–60 min, HR under 135 bpm. Roughly 300–400 kcal/session without eating into recovery. Five training days/week total is fine **as long as the new rides stay genuinely easy** — the known failure mode is drifting to threshold and turning easy days hard.
3. **Protein pinned at 185 g** — the primary muscle-sparing lever, more than the calorie number.
4. **Weekly loss target: 0.5–1.0 lb/week.** Faster than ~1.5 lb/week = under-eating, add food back.

---

## The core product insight: maintenance is a measurement, not an estimate

Static calculators guess maintenance (the ~2,600 figure) and never learn whether the guess was right. Steward can **measure** it from the user's own data:

- Take average intake over a rolling window (2 weeks minimum).
- Take average weight change over that same window (morning weigh-ins, same conditions, weekly-averaged so water-weight noise cancels).
- Derive maintenance from the net: e.g. ~2,150 kcal/day with ~1 lb/week loss ⇒ ~1 lb ≈ 3,500 kcal ⇒ ~500/day deficit ⇒ true maintenance ≈ 2,650.
- **Self-correcting:** as bodyweight drops, true maintenance drifts down; the rolling recompute catches the plateau automatically instead of the user stalling and wondering why.

### Why workouts / step variance don't break the math

You do **not** model workout burn, steps, or NEAT separately. **The scale already absorbed all of it.** Any expenditure is downstream in the weight trend. Averaging over a long-enough window (2+ weeks) cancels daily noise, yielding true *average* maintenance across the user's actual lifestyle.

- **Limitation:** wildly inconsistent week-to-week activity makes the number fuzzier.
- **Why it works for Micah:** a fixed, patterned training week (Mon–Fri structure, weekend rest) is exactly the consistency that makes the derived number reliable.

---

## The bigger vision (what Micah explicitly wants Steward to become)

Move from "calorie + protein tracker" to a **conversational, holistic health partner** that:

1. Talks through goals, thoughts, and plans the way this session did (gain, cut, recomp — build the plan collaboratively).
2. Ingests multiple data streams: in-app intake logs, **Garmin** (workouts, sleep, HR, load), and daily weight.
3. Runs calculations against goals — surfacing whether the user is on track, and what to change if not.
4. **Grows more valuable as more data is given.** The depth of insight scales with the breadth of inputs.

### DEXA scans as point-in-time model anchors

- Upload a DEXA scan → log it as a **point in time**.
- Combine multiple scans over months + daily weight + intake to answer the question the scale alone **cannot**: _was the weight lost fat or muscle?_
- This is the payoff of the whole engine — the insight a static app can never produce because it never sees whether its estimates were right.
- Architecturally: a DEXA scan is **just another data type flowing into the same model** — no new screens. This is the direct expression of Micah's standing principle: **config is data, not code.**

---

## How this maps to existing Steward architecture

- **"Memory is the product"** → the memory layer becomes a quantitative body model, not just qualitative facts/patterns.
- **`TrackingPlan` (config-as-data)** → new input *types* (weight series, DEXA scan, Garmin activity/sleep) plug into the same data model; no bespoke UI per input.
- **Repository seam** → the derived-metrics engine (rolling maintenance, trajectory) should live behind the same portable seam so it survives the eventual Supabase move.
- **Dependencies:** the Garmin ingestion piece is **WP21** (deferred, v0.2) and real HealthKit is **WP17** — both feed this engine. DEXA logging extends the existing InBody/manual scan entry (WP15).

---

## Suggested questions for Claude Code to think through

1. **Windowing:** fixed 14-day vs. exponentially-weighted rolling average for maintenance? How to weight recent days without over-reacting to noise?
2. **Confidence:** how to express and surface uncertainty when activity variance is high or logging is sparse — the app must not fake precision (existing principle).
3. **Fat-vs-muscle attribution:** with only sparse DEXA points + dense weight/intake, what's a defensible model for interpolating lean/fat trajectory between scans? What's honestly *not* inferable?
4. **Cold start:** how does the engine behave in week one before it has a window? (Fall back to the static estimate, labeled as such.)
5. **Data hygiene:** de-dupe and provenance tagging for Garmin-imported vs. in-app data (already flagged in backlog R2-3).
6. **Goal-mode coupling:** how the maintenance/trajectory engine feeds each goal mode (cut, bulk, recomp) and its rings/checklist.

---

## Immediate action already taken this session

- Daily morning weigh-in reminder set (5:00 am, recurring). Micah reports the number each morning; Claude holds the running average and runs the maintenance math at the 1-week and 2-week marks — deliberately verbal, as a live dogfood of the conversational-logging model.
