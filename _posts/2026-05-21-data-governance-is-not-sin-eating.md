---
layout: post
title: Data Governance is not Sin-Eating
date: 2026-05-21
tags: [data, tooling, opinion]
description: Why most data governance is sin-eating with a job title, and what the work looks like when the person doing it actually has the buy-in to care.
---

Somewhere between the seventeenth and nineteenth centuries, in bits of Wales, Scotland, and the English border counties, a destitute man might be summoned to a funeral to perform a peculiar service. Typically a piece of bread would be placed on the chest of the corpse. The bread was believed to absorb the unconfessed sins of the deceased. The sin-eater would eat it, take the metaphysical burden onto his own soul, mutter something solemn, and pocket the four or six pence he was paid for the trouble.

He would then be driven from the house with sticks, never to be invited back until the next funeral. In the context of the modern gig-economy this would be considered one of the better roles.

The deal was elegantly transactional. The family did not have to grieve any sins their loved one might still be carrying. The community did not have to look its own dirty laundry in the face. A desperate man took on the burden, was paid a pittance, and was then shunned. Everyone got what they wanted, except, fairly obviously, the sin-eater.

Most data governance, in my experience, is this. And you don't even get to eat any bread.

## The job is real. The role is fake.

Every organisation produces dirty data. It accumulates the way dust does — by no-one's particular fault, and by everyone's. Categories drift. The same SKU acquires three different descriptions across three systems, each authored by someone who had clearly never met the other two. Discounts get keyed against orphan line items rather than the products they apply to. Customers are tagged inconsistently or not at all. At some point the reporting layer starts producing numbers that don't reconcile, the dashboards quietly start contradicting each other, and somebody senior eventually asks the inevitable question: *whose mess is this?*

This is the moment at which somebody, usually a consultant, suggests appointing a **Data Owner**.

The person picked is generally a junior analyst, or whoever happened to be out of the room when the meeting started. They are handed a spreadsheet of broken records, told they are now accountable, and the rest of the business carries on, absolved. It is a wildly unreasonable thing to ask of one person, but it serves the only purpose that actually matters: there is now a name to put on a slide when somebody asks whether you have data governance. *(Yes. Look. We have a Data Owner. Her name is Megan, she is twenty-four, and she has not slept properly since March.)*

## Bread is symbolic. NetSuite is not.

The village ritual worked because the transaction was symbolic. Nobody actually believed the bread was digesting a sin in any literal sense; they believed it transferred a spiritual burden, which is a much more flexible thing to transfer.

Data, sadly, is real.

A Data Owner with no domain knowledge cannot fix a wrong category, because they have no way of knowing what the right category looks like. A Data Owner without the authority to refuse a non-compliant item being entered into NetSuite (or Salesforce, or any of the other source systems that have made grown adults cry) cannot maintain a standard, because the standard will be politely escalated around them by the first person with a deadline. A Data Owner who has had the role bolted onto an already full job will skip the quarterly audit, because there has never in the history of the working week been a quarter in which a person had spare capacity for a quarterly audit.

The role becomes ceremonial. The data stays filthy. The reports continue to lie to one another in increasingly elaborate ways. The only thing that has actually changed is that there is now a designated name to point at when the next reconciliation goes sideways, the village has appointed a sin-eater.

## Governance is not a job title. It is a set of conditions.

Good data governance is much less mysterious than the volume of consultancy spent on it would suggest. I would summarise it as three conditions, which are dull individually and powerful together, and none of which require a deck.

**The first is that people understand why the data matters.** "Because the data team asked us to" is not a reason; it is a sentence. If a buyer knows that the mandatory field they are about to fudge feeds directly into the out-of-stock report they look at every Monday morning, they will fill it in properly. If it reads like bureaucratic noise, they will type "n/a" and get on with their day, and frankly who could blame them. People maintain data they can see the point of, and the responsibility for making the point visible sits with the data team, not with the buyer.

**The second is that whoever owns the data has knowledge, authority, and capacity.** All three. Domain knowledge so they can tell good from bad and recognise the edge cases. Authority so when they refuse a non-compliant record at the source, the refusal sticks instead of being routed around them at 4pm on a Friday. Capacity so the role lives in their job description rather than appearing as a one-line addition to it in an email nobody quite remembers sending. Where it makes sense, DAMA-DMBOK and assorted other people who have thought about this for longer than I have recommend pairing an accountable Data Owner (senior, sets the standard) with a Data Steward (operational, does the work day to day). This is sensible. It exists, in part, precisely because the alternative is the sin-eater trap.

**The third is that the people maintaining the data are the first to benefit from it.** This is the bit most often forgotten, and it is the bit that makes the whole thing actually work. Buyers should see where they are losing margin. Account managers should see which customer segments are quietly worth more of their time than they realised. Operations should see where stockouts are actually costing money, in pounds rather than vibes. Insights should stop being something handed down to the business by the data team and start being something the business gets out of its own discipline. The owner is no longer carrying a burden so everyone else can look the other way; they are maintaining the inputs that produce the outputs that make their own work easier. Which is rather more dignifying than being sent the bread.

## Stop hiring sin-eaters.

The Welsh sin-eater walked away with sixpence and a soul full of other people's misdeeds, and was driven from the house with a stick. It is a poor model for data governance. The version worth building is where the person who owns the data has the knowledge and the authority to look after it, and gets a clearer view of their own work in return. Nobody has to get hit with a stick. Nobody has to eat the potato.
