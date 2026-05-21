---
layout: post
title: Data Governance is not Sin-Eating
date: 2026-05-21
tags: [data, tooling, opinion]
description: Why most data governance is sin-eating with a job title, and what the work looks like when the person doing it actually has the buy-in to care.
---

Somewhere between the seventeenth and nineteenth centuries, in bits of Wales, Scotland, and the English border counties, a destitute man might be summoned to a funeral and asked to perform a peculiar service. A piece of bread, or in some parishes a baked potato (the menu varied by how seriously the village was taking it), would be placed on the chest of the corpse. The bread was believed to absorb the unconfessed sins of the deceased. The sin-eater would eat it, take the metaphysical burden onto his own soul, mutter something appropriately solemn, and pocket the four or six pence he was paid for the trouble.

He would then be driven from the house with sticks, never to be invited back until the next funeral. A flexible-hours role, in fairness, but the benefits package was poor. *(The last documented sin-eater, a Shropshire farmer called Richard Munslow, died in 1906; his grave at Ratlinghope was restored with some ceremony in 2010, which is presumably the closest the profession has come to a pension.)*

The deal was elegantly transactional. The family did not have to grieve any sins their loved one might still be carrying. The community did not have to look its own dirty laundry in the face. A desperate man took on the burden, was paid a pittance, and was then shunned. Everyone got what they wanted, except, fairly obviously, the sin-eater.

I have a working theory that data governance, done badly, is the same transaction with worse bread.

## The Corporate Sin-Eater

Every organisation produces dirty data. Categories are missing or contradictory, the same SKU has three different descriptions across three systems (each authored, presumably, by someone who had never met the other two), discounts are recorded against orphan line items rather than the actual products they apply to, and customers are tagged inconsistently or not at all. At some point the reporting layer starts producing numbers that don't reconcile, the dashboards quietly start contradicting each other, and somebody senior asks the inevitable question: *whose mess is this?*

The temptation, at this point, is to find a sin-eater.

You pick someone, usually a junior analyst or whoever happened to be out of the room when the meeting started, and you give them the title **Data Owner**. You hand them a spreadsheet of broken entries, tell them they are now accountable, and the rest of the business carries on, absolved. It is a wildly unreasonable thing to ask of one person, but it serves a vital bureaucratic purpose: there is now a name to put on a slide when somebody asks whether you have data governance. *(Yes. Look. We have a Data Owner. Her name is Megan and she has not slept since March.)*

### Why the metaphor breaks down

The village ritual worked because the transaction was symbolic. Nobody actually believed the bread was digesting a sin in any literal sense; they believed it transferred a spiritual burden, which is a much more flexible thing to transfer.

Data, sadly, is real.

A Data Owner with no domain knowledge cannot fix a wrong category, because they have no way of knowing what the right category looks like. A Data Owner without the authority to refuse a non-compliant item being entered into NetSuite (an experience I would not wish on anyone for any number of reasons) cannot maintain the standard. A Data Owner on whom the role has been bolted as an unpaid extra to an already full job will skip the quarterly audit, because there is no quarter in which a person has space for a quarterly audit on top of their actual work.

The role becomes ceremonial. The data stays filthy. The reports continue to lie to one another. The only thing that has changed is that there is now a designated name to point at when the next reconciliation goes sideways, which is, on reflection, exactly the part of the arrangement the village wanted from the sin-eater in the first place.

## What it actually looks like when it works

Good data governance is far less mysterious than the volume of consultancy spent on it would suggest. I would summarise it as three things, none of which require a framework deck.

### 1. Show people the point of it

People maintain data they can see the point of. "Because the data team asked us to" is not a reason; it is a sentence. If a buyer knows that the mandatory field they are tempted to fudge feeds directly into the out-of-stock report they look at every Monday morning, they will fill it in properly. If it reads like bureaucratic noise, they will type "n/a" and get on with their day, and frankly who could blame them.

### 2. Match knowledge to authority

The matter of who actually owns the data is where most organisations come unstuck. A Data Owner needs domain knowledge, so they know what good looks like and where the edge cases are. They need authority, so when they refuse a non-compliant record at the source the refusal sticks instead of being escalated around them by someone with a deadline. And they need capacity, which is to say the role is in their job description rather than added to it in a one-line email on a Friday afternoon.

> Where it makes sense, DAMA-DMBOK and assorted other people who have thought about this longer than I have recommend pairing an accountable Data Owner (senior, sets the standard) with a Data Steward (operational, does the work day to day). This is sensible, and exists in part precisely because the alternative is the sin-eater trap.

### 3. Let the owner keep something

The bit most often forgotten is what the Data Owner gets back for the trouble. When the data is maintained properly, the person maintaining it ought to be the first to benefit from it. Buyers should see where they are losing margin. Account managers should see which customer segments are quietly worth more of their time than they realised. Operations should see where stockouts are actually costing money, in pounds rather than vibes. Insights stop being something handed down to the business by the data team and start being something the business gets out of its own discipline, which is rather more dignifying than being sent the bread.

---

The Welsh sin-eater walked away with sixpence and a soul full of other people's misdeeds, and was hated for it. It is a poor model. The version worth building is the other one, where the person who owns the data has the knowledge and the authority to look after it, and gets a clearer view of their own work in return. Nobody has to get hit with a stick.
