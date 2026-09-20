# Personal Skills

My collection of agent skills for building software, product decisions, design, and writing. Pick what you need.

[Install](#install) · [Dexter team](#the-dexter-team) · [Planning](#planning) · [Build and design](#build-and-design) · [Writing](#writing)

## Install

```sh
npx skills@latest add takoonit/personal-skills
```

## The Dexter team

A little *Dexter* for better codebase. Call in whoever the case needs.

### Dexter

Ask an agent to simplify something and sometimes you get another abstraction. I want the dead weight gone.

Dexter hunts unused code, duplicated logic, and complexity that has no job. He traces the evidence, builds a kill list, and takes out approved targets. Then he checks that the survivors still work.

**Prompt example**

```text
$dexter
We moved checkout to Stripe, but src/payments still has the old provider
and two wrapper layers. Can the legacy path go? Existing subscriptions
must keep working. Report first.
```

[Skill →](skills/dexter/SKILL.md)

### Doakes

It starts as a small fix. Somewhere in the diff, the agent changes a rule nobody asked it to change.

"Surprise, Mother Fucker!" Doakes checks the implementation against the brief, catches the drift, and shows exactly where the story stopped adding up. Suspicion gets him looking. Evidence makes the case.

**Prompt example**

```text
$doakes
This PR was only supposed to add CSV export, but it also touches download
permissions. The agreed rule is "workspace admins only."
Is that still true? Don't edit.
```

[Skill →](skills/doakes/SKILL.md)

### Lundy

The agent says it's done. I still want to know what was actually checked.

Lundy takes a fresh look at the requirements, implementation, and test evidence. He follows the gaps, checks the failure paths that matter, and tells you what holds up. The case stays open where proof is missing.

**Prompt example**

```text
$lundy
The retry fix is marked done and unit tests pass. The requirement is:
retrying a timed-out payment must never charge twice.
Does the current diff have enough proof to accept it? No fixes yet.
```

[Skill →](skills/lundy/SKILL.md)

## Planning

### Strategic Gate

An idea can be worth doing and still be the wrong thing to work on now.

Strategic Gate weighs the evidence, effort, and work you'd give up to pursue it. Use it when priorities compete or the reason to act is weak. You get a decision to pursue, defer, replace, or reject, with a reason.

**Prompt example**

```text
$strategic-gate
I have five dev-days. CSV export takes two and blocks renewals for two
paying customers. An onboarding rewrite takes five; signups drop off
there, but we haven't interviewed users. What gets this week?
```

[Skill →](skills/strategic-gate/SKILL.md)

### Shark Tank

A convincing pitch doesn't tell me whether anyone will pay for it.

Shark Tank challenges a business through customer demand, competitive advantage, and economics. Bring an idea or traction data before committing more time or money. It gives you a commercial verdict, the weakest assumption, and the next test worth running.

**Prompt example**

```text
$shark-tank
I'm considering a $15/month invoicing app for freelance designers.
Five interviewees liked the idea; none has paid. They use spreadsheets now.
I can spend two weekends on it. Is a build justified yet?
```

[Skill →](skills/shark-tank/SKILL.md)

### Shape System Work

"Build an MVP" leaves a lot for an agent to decide on its own. Those decisions get expensive once they're buried in code.

Shape System Work resolves unclear scope, architecture, or build-versus-buy choices. It compares the options and turns the chosen direction into a brief with boundaries, trade-offs, and checks for success.

**Prompt example**

```text
$shape-system-work
We already send one-off invoices. Customers now want monthly recurring ones.
Keep the existing database and email provider. No automatic card charges
in v1. Where should the first release stop?
```

[Skill →](skills/shape-system-work/SKILL.md)

## Build and design

### Ship Sound Code

Once the direction is agreed, I want the change built and checked.

Ship Sound Code handles defined features, fixes, and refactors. It follows the repo's conventions, implements the scoped change, tests the affected behavior, and fixes regressions it introduces. It finishes with what works and what couldn't be verified.

**Prompt example**

```text
$ship-sound-code
In POST /invoices, reject a due date earlier than the invoice date with
HTTP 422. Equal dates stay valid, and existing error-response fields must
stay unchanged. Implement this in the current repo. Don't commit.
```

[Skill →](skills/ship-sound-code/SKILL.md)

### Intentional Design

A screen can look finished while leaving users guessing what to click or whether anything happened.

Intentional Design inspects the actual interface and improves its hierarchy, states, and feedback within the existing design system. Use it to review a flow or implement an agreed improvement, with checks on the affected interactions.

**Prompt example**

```text
$intentional-design
At /checkout, the total sits below Pay on mobile and failed payments
erase the form. Keep our existing components and branding.
Propose a layout and failure state before changing code.
```

[Skill →](skills/intentional-design/SKILL.md)

### Laws of UX

"This feels confusing" is a useful signal. It doesn't tell us what to change yet.

Laws of UX examines a rendered journey or recording, connects the observed friction to a behavioral mechanism, and recommends a correction with a way to test it. If the evidence is too thin, it says so instead of attaching a law to everything.

**Prompt example**

```text
$laws-of-ux
In the attached checkout recording, a shopper taps Pay three times during
a two-second wait with no visible response. What's the most likely
friction here, and what would disprove that explanation?
```

[Skill →](skills/laws-of-ux/SKILL.md)

## Writing

### Clear Tactful Writing

Ask an agent to polish a message and it can come back sounding like someone else. Sometimes it even adds a promise I never made.

Clear Tactful Writing rewrites emails, chats, and difficult requests in natural Thai or English. It adjusts the tone, cuts filler, and keeps the facts and commitments intact. You get a draft ready to use.

**Prompt example**

```text
$clear-tactful-writing
Write a Thai LINE message to a client: the extra dashboard is outside
our agreed scope. I can quote it separately, but Friday's delivery covers
only the original work. Friendly and firm, under four sentences.
```

[Skill →](skills/clear-tactful-writing/SKILL.md)

[Contributing](CONTRIBUTING.md) · [Evaluation](docs/evaluation.md)
