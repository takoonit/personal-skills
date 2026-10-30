## What Happened

- **Change:** [Resulting behavior, affected screen/route or module, and purpose.]
- **Requirement:** [Task and relevant parent expectation links; brief problem.]
- **Risk:** [Low / Medium / High — reason] · **Found in:** [Known environment, or omit.]

---

## Insight

- **When [user action]:** [Function/request → owning service or transformation → previous result.]
- **Why it happened:** [Supported cause or limitation and its effect on the user.]
- **Changed flow:** [What now happens and why that fixes the result.]
- **Limits/dependencies:** [Material uncertainty, release order or undo consequence. List each requirement decision settled by assumption and who must confirm it, plus known sibling follow-ups and their decision owner; omit if inapplicable.]

---

## Proof of Works

**Scope.** [Environment, baseline/fixed revision, fixture or real data, executor, and verification limits.]

**[Case: product user's task]**

**Role/setup.** [Role, permissions, starting state and relevant data.]

**Actions.** [Entry point and ordered product actions.]

**Expected.** [The linked Work Item's visible or persisted result.]

**1. [Product action on the fixed build].** Expected: [visible result]. Observed: [actual result in the browser].

![After: step 1](attachment:after-1.png)

**2. [Next product action].** Expected: [visible result]. Observed: [actual result].

![After: step 2](attachment:after-2.png)

<!-- After only by default. Add a Before capture only when the user asks; never use the reported bug screenshot as proof. -->

**Supporting checks.** [One line: actual commands/scenarios and results, with log links.]

**Unverified.** [Remaining acceptance, persistence, deployment or SIT gaps.]
