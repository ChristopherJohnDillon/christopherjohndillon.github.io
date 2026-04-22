---
layout: post
title: PowerBI Is a Tax on Competence
date: 2026-04-22
tags: [data, tooling, opinion]
description: Why plain text, version-controlled analytics is a categorically different thing from drag-and-drop BI — and why LLMs have widened the gap permanently.
---

There’s a category of business software that exists specifically to let people who don’t want to write code pretend to do something technical. PowerBI is the canonical example. Tableau, Alteryx, Qlik, most no-code data platforms — they all share a founding assumption: that writing code is a barrier to getting work done, and that the right response is to wrap every operation in a drag-and-drop interface.

I think this assumption is wrong. I think it’s been wrong for twenty years, and I think the arrival of useful LLMs has made it so wrong that continuing to believe it is now actively negligent.

Ludic’s [PowerBI Is A Human Rights Violation](https://ludic.mataroa.blog/blog/powerbi-is-a-human-rights-violation/) is the definitive takedown of the product itself. Read it. I won’t rehash his points on usage stats, bullshit jobs, or the technical horrors of an unzippable XML BLOB. What I want to argue instead is the positive case — why plain text, version-controlled, code-first analytics is a categorically different thing, and why the gap is widening.

## Git is not a feature. Git is the governance layer.

When your analytics lives in code — a Streamlit app, a DuckDB query, a Parquet pipeline — every meaningful change is a diff. Every diff has an author. Every deployment is a commit. When someone asks *why did the margin BPS calculation change last quarter*, you can answer them. You can blame the exact line. You can roll it back. You can open a pull request to fix it and have a colleague review before it goes live.

This isn’t a convenience. This is the entire basis for trustworthy reporting at scale.

In PowerBI none of this exists. The logic lives in a binary file that doesn’t diff. Two analysts working on the same dashboard overwrite each other. *Who changed this measure?* is answered by opening the file and staring at it. If the change was six months ago, you’re guessing. This is how organisations end up with three different definitions of revenue sitting in three different dashboards. It is not a discipline problem. It is a tooling problem that makes discipline structurally impossible.

## Duplication costs nothing.

We run the same analytical patterns across eighteen businesses at Nexus Brands Group. With code, one well-written Streamlit page serves all eighteen — parameterised, tested once, deployed everywhere. If the calculation changes, it changes in one place. If a new business joins, it inherits the whole stack for free.

In a GUI BI tool this is impossible without enterprise licensing tiers and dedicated consultants. The tool is deliberately structured so that scale requires more of the tool. That is the business model.

## LLMs have changed the maths permanently.

Here is the part the PowerBI world has not come to terms with.

Text is the native medium of large language models. When my analytics lives in Python and SQL, I can develop at the speed of thought. I describe what I want, Claude writes it, I review the diff, I commit. A dashboard that would have taken a week now takes an afternoon, and the output is often cleaner than what I would have written unassisted. Every analyst on a well-equipped team has effectively acquired a senior pair programmer at zero marginal cost per query.

You can technically drive GUI tools with LLMs — products like Codex can control a screen, click buttons, fill in fields. But screen-control costs orders of magnitude more tokens than text generation, runs more slowly, and produces output that is, by construction, ungovernable — because the artefact being produced is still a binary blob. You’re paying a twenty-first century tool to generate twentieth-century artefacts.

The gap between what a good analyst can produce with code + LLMs and what the same analyst can produce in PowerBI is now so large that insisting on the GUI is actively throwing away their productivity. You are paying for a licence to slow your team down.

## Give good people good tools.

The pitch for PowerBI has always been that it democratises data — that anyone can use it. In practice this means it is a tool designed for the lowest common denominator, and by extension a tool that rewards mediocrity and punishes skill. A competent analyst can do more in fifty lines of Python than in a month of dragging widgets onto a page. Forcing them to use the GUI is an insult. It says: *we assume you’re not good enough for proper tools*.

If you have hired well, give your team tools that match. Python. SQL. DuckDB. Parquet. Streamlit. Git. A shared codebase. Pull request reviews. Proper deployments. These are not exotic — they are the standard working environment of every serious software team on the planet, and there is no reason analytics should operate to a lower standard.

If you have not hired well, no tool will save you. PowerBI will not. Claude will not. The dashboard will still go unread.

## What I actually use.

For anyone curious, the NBG stack is MariaDB as the warehouse, DuckDB and Parquet as the analytical serving layer, Streamlit for dashboards (secured via Microsoft Entra SSO), and Python throughout. Everything in git. Everything reviewable. Everything that matters, diffable.

It is unglamorous, robust, and cheap. It produces reporting our executives actually use. It lets a three-person data team support eighteen businesses. And critically — when an LLM arrives next year that is twice as good as today’s, my team will absorb its productivity gains on day one, because our work is already expressed in the medium the LLM understands.

Pick tools your team can think in. Pick tools that compose. Pick tools that let you hire more good people and give them leverage. Don’t buy off-the-shelf software designed for people you would never hire.
