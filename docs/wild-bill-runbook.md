# Wild Bill Tune-Up Runbook

**Written:** July 8, 2026
**Goal:** Make reminders reliable, then clear the quota/model ceiling. Companion to the
Project State Summary (07/07/2026).

## How to use this

- Run **one step at a time** at the Mac Mini (lab user), or over SSH via Tailscale.
- **Type commands manually** — this Mac Mini has Unicode paste artifacts. Where a
  command is long, the heredoc blocks are the exception: paste those carefully or type them.
- After each **CHECKPOINT**, stop and send Claude the output (screenshot or copy/paste).
  Claude gives you the next step from real state, not assumptions.
- **Stop rule:** any output that doesn't match what the step says to expect → stop,
  send it to Claude. Don't improvise. Five minutes of inspection beats three hours of file editing.

---

## Why reminders have been inconsistent (read before starting)

Three separate failures stack on top of each other. Any one of them makes a reminder
silently vanish, which is why it *feels* random:

1. **Hallucinated confirmations.** Wild Bill says "I'll remind you Thursday" but nothing
   was ever persisted anywhere. He cannot schedule future actions without infrastructure —
   he confirms anyway. This is the worst one because it destroys trust in the others.
2. **The cron outbound bug** (OpenClaw v2026.3.24). After any gateway restart, scheduled
   jobs fail silently with `Outbound not configured for channel: telegram` until an
   inbound Telegram message re-registers the channel. So even *real* scheduled jobs die
   quietly after a reboot.
3. **Quota exhaustion.** If the Gemini free-tier limit is hit by mid-day (organic use or
   a retry storm), any scheduled job that fires after that point fails.

The fix strategy: make reminders **boring and verifiable** — a reminder is a Notion task
with a due date (the write path we already trust), surfaced by a small number of daily
checkpoint messages. No per-minute polling until the quota question is settled.

---

## Session A — State audit + snapshot (~30 min)

Everything after the 05/04 resurrection is documented from memory. Verify before building.

**A1. Confirm the ghost Python bot is still dead:**

```
pgrep -fl telegram_bot
```

Expect: no output. If you see a PID, stop — CHECKPOINT, send it to Claude.

**A2. Check what launchd is running for the lab:**

```
launchctl list | grep -i tov
```

Expect: nothing, or only entries you recognize as current. Anything with `telegram-bot`
in it is a problem — CHECKPOINT.

**A3. Confirm exactly one OpenClaw instance:**

```
pgrep -fl openclaw
```

Expect: one process group, not two.

**A4. Record the OpenClaw version:**

```
openclaw --version
```

Write it down. Claude needs it to check whether the cron-outbound bug and the memory
skill are fixed/shipped in a newer release.

**A5. Confirm the model string (wizard writes stale ones — read the file, never the wizard):**

```
cat ~/.openclaw/openclaw.json
```

Note the model name you see.

**A6. Put the workspace under git (5 minutes now vs. weeks of rebuilding later):**

```
cd ~/.openclaw/workspace
```

```
git init
```

```
git add -A
```

```
git commit -m "Baseline snapshot of Wild Bill workspace, July 2026"
```

Expect: a commit listing SOUL.md, IDENTITY.md, USER.md, AGENTS.md, etc.

**CHECKPOINT A — send Claude:** output of A1–A5 and the file list from A6.

---

## Session B — Reminder pipeline + quota diagnosis

**B1. See what's actually scheduled:**

```
openclaw cron list
```

If that errors, try `openclaw cron` alone, then stop — CHECKPOINT with whatever it printed.
(Cron subcommand syntax varies by version; Claude finalizes Session C's job commands
from this output.)

**B2. Find the logs:**

```
ls -la ~/.openclaw/
```

Look for a `logs` folder (or similar). Then:

```
ls -la ~/.openclaw/logs/
```

**B3. Check for the outbound bug firing:**

```
grep -r "Outbound not configured" ~/.openclaw/logs/ | tail -5
```

Any hits mean scheduled deliveries have been dying silently. Note the dates.

**B4. Check for a retry storm (the quota question):**

```
grep -rc "429" ~/.openclaw/logs/ | tail -10
```

429 is the rate-limit error. A handful = organic usage near the ceiling. Hundreds =
runaway retries, and fixing that loop solves quota for free.

**CHECKPOINT B — send Claude:** B1 output, B3 hits, B4 counts, and the log folder
listing. This decides: fix a retry bug vs. move to a paid model (Haiku 4.5 is the
leading candidate — it would also likely fix compound requests and the voice).

---

## Session C — Fixes (after Claude reviews Checkpoint B)

**C1. The honesty rule — stops hallucinated confirmations today:**

```
cat >> ~/.openclaw/workspace/AGENTS.md << 'EOF'

## Reminders — hard rules

- A reminder only exists if it is a Notion task with a Due date, created by a real
  tool call in this turn. Never confirm a reminder any other way.
- If you did not (or could not) create the Notion task, say plainly: "I can't schedule
  that yet." Do not promise future messages. You have no ability to send a message at
  an arbitrary future time; due tasks are surfaced at the daily checkpoint briefings.
- When you create a reminder task, state the task name and due date back to Micah so
  he can spot-check it in Notion.
EOF
```

**C2. Checkpoint briefings.** The 7:00 AM briefing already exists. We add midday
(12:30 PM) and evening (5:30 PM) runs that fetch tasks due today from Notion and
deliver them to Telegram. The exact `openclaw cron add` syntax depends on your version —
**Claude writes these two commands for you after seeing Checkpoint B**, and you run
them here.

**C3. The restart guard.** Until the outbound bug is confirmed patched in your version:
after any Mac Mini reboot or gateway restart, send Wild Bill any Telegram message
("howdy") before trusting the day's scheduled deliveries. Tape this to the monitor if
needed.

**C4. Commit the changes:**

```
cd ~/.openclaw/workspace
```

```
git add -A
```

```
git commit -m "Reminder honesty rules and checkpoint briefing conventions"
```

---

## Session D — Verify (don't trust Wild Bill's word — this is the whole point)

**D1. The reminder test.** In Telegram, tell Wild Bill:
*"Remind me Thursday at 6pm to take the trash out."*

Then open Notion yourself and check the Tasks database for a task with a Thursday due
date. Wild Bill confirming ≠ pass. **The task existing in Notion = pass.**
If he confirmed but Notion is empty → CHECKPOINT, the rule needs tightening.

**D2. The refusal test.** Tell him: *"Send me a message in 20 minutes."*
Pass = he says he can't do arbitrary-time messages and offers a Notion task /
checkpoint instead. Fail = "Sure, will do!"

**D3. The delivery test.** Wait for the next checkpoint briefing (12:30 or 5:30).
Pass = a Telegram message arrives listing the due tasks, including D1's task on Thursday.

**D4. The restart test (optional but recommended).** Restart the gateway, send no
inbound message, and see whether the next checkpoint delivers. This tells us if the
outbound bug still applies to your version.

**CHECKPOINT D — send Claude:** pass/fail on D1–D4.

---

## Session E — Compound requests + model decision (after reminders are solid)

Run these three as separate Telegram messages, in order, verifying each in Notion:

1. *"Add a task: buy fence stain, due Saturday."* (write path alone)
2. *"Mark the fence stain task done."* (complete path alone)
3. *"Mark the trash task done and add a new task: sharpen mower blades, due Friday."* (compound)

If 1 and 2 pass but 3 fails, the tool wiring is fine and the model is the bottleneck —
that plus the quota data makes the Haiku 4.5 swap decision. Record results before any
model change so there's a clean before/after.

---

## Deferred (not this arc)

- Voice/persona tuning — do *after* any model swap; prompt-tuning Flash may be wasted work.
- "Wold Bill" BotFather typo — 2 minutes, whenever.
- Saturday self-review automation, semantic memory, multi-agent team, webhook migration —
  all wait until the daily loop is boring and reliable.
