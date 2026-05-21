---
layout: post
title: Data Governance is not Sin-Eating
date: 2026-05-21
tags: [data, tooling, opinion]
description: Why most data governance is sin-eating with a job title, and what the work looks like when the person doing it actually has the buy-in to care.
---

Between roughly the seventeenth and nineteenth centuries, across parts of Wales, Scotland, and the English border counties, a destitute man might be summoned to a funeral to perform a peculiar service. A piece of bread—or, depending on the parish, a baked potato—would be placed on the chest of the corpse. The belief was that the food would absorb the unconfessed sins of the deceased. The sin-eater would eat it, take the metaphysical burden onto his own soul, mutter a quick blessing, and pocket a pittance of four or six pence.

He would then be promptly beaten out of the house with sticks, never to be invited back until the next funeral. *(Unfortunately for the profession, the last documented sin-eater, a Shropshire farmer named Richard Munslow, died in 1906).*

It was a beautifully transactional absolution. The family didn't have to carry the grief of their loved one's lingering transgressions, the community avoided looking its dirty laundry in the face, and a desperate man took the fall. Everyone got what they wanted—except, fairly obviously, the sin-eater.

I have a working theory that data governance, when done badly, is the exact same transaction.

---

## The Corporate Sin-Eater

Every organization produces dirty data. It is a fundamental law of corporate entropy. Categories are missing, the same SKU somehow has three completely different descriptions across three different systems, and discounts are recorded against orphan line items rather than the actual products they apply to. At some point, the reporting layer begins to produce numbers that don't reconcile, the dashboards quietly start contradicting each other, and leadership asks the inevitable question: *whose mess is this?*

The immediate corporate temptation is to find a sin-eater.

You find someone—usually a junior analyst, or anyone currently lacking the political capital to say no—and slap the title **Data Owner** on them. You dump a sprawling spreadsheet of broken entries on their desk, declare them accountable, and the rest of the business carries on, blissfully absolved. It sets an entirely unreasonable expectation for a single person's work-rate, but it serves a vital bureaucratic purpose: you now have a name to put on a PowerPoint slide whenever executives ask if you have a data governance strategy. *(Yes. Look. We have a Data Owner.)*

### Why the Metaphor Breaks Down

This setup fails for reasons that are no great mystery. The village ritual worked because the transaction was entirely symbolic; nobody actually believed the bread literally digested a crime, they just believed it transferred a spiritual burden.

Data, unfortunately, is stubbornly real.

A Data Owner sat in a corner with no domain knowledge cannot fix a broken product category, because they have no way of knowing what the *right* category looks like. If they don't have the authority to block a non-compliant entry in NetSuite or Salesforce, they have no way to maintain the standard anyway. And when the role is tacked on as an unpaid extra to an already overflowing day job, they will invariably skip the quarterly audit, because nobody has space for bureaucratic chores on top of their actual work.

The role becomes purely ceremonial. The data stays filthy, the reports continue to lie to each other, and the only thing that has actually changed is that management now has a designated name to point at when the next reconciliation fails—which is, on reflection, the exact part of the arrangement the village wanted from the sin-eater in the first place.

---

## What Actual Governance Looks Like

What good data governance looks like is much less mysterious than the sheer volume of consultancy fees spent on it would suggest. It can be over-simplified to three basic steps:

### 1. Show them the point of it

People only maintain data they see the practical purpose of. "Because the data team asked us to" falls entirely short of an incentive. If a buyer knows that filling out a tedious mandatory field directly feeds the out-of-stock report they rely on every Monday morning, they'll do it. If it reads like bureaucratic noise, they'll ignore it. Connect the inputs to the outcomes.

### 2. Match knowledge with authority

The matter of who actually "owns" the data is where most organisations come unstuck. A Data Owner needs domain knowledge to know what "good" looks like, the authority to reject a non-compliant entry at the source and make it stick, and the actual calendar capacity to do the work.

> **The Best Practice:** Established frameworks like DAMA-DMBOK recommend pairing a senior Data Owner (who sets standards) with an operational Data Steward (who executes daily)—precisely to avoid the single-scapegoat trap.

### 3. Make it a two-way street

The biggest missing piece is what the Data Owner gets back for their trouble. When data is maintained properly, the people doing the cleaning should actually win. Buyers should see where they are losing margin. Account managers should see which customer segments are actually worth their time. Operations should flag stockouts with hard numbers instead of gut intuition.

---

The Welsh sin-eater walked away with sixpence, a soul full of other people's misdeeds, and a village that despised him. It is a miserable system to replicate. Data governance shouldn't look like a punishment dressed up as a process; it should look like showing colleagues their contribution to something they themselves benefit from. The version worth building is the one where the person who owns the data has the tools to look after it, and gets a vastly clearer view of their own success in return.
