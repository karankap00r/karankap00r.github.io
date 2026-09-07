---
title: "Oncall — a nightmare or a golden opportunity"
date: 2023-09-03
published: true   # set to false to hide this post everywhere
description: "On-call is the week most engineers dread, but it is also the fastest way to learn how a system really works. I argue that it is worth wanting, and share what to do when you are the one holding the pager."
tags: [engineering, oncall, reliability]
link: https://medium.com/engineering-with-karan/oncall-a-nightmare-or-golden-opportunity-a49662bb8c51
source: Medium
---

*and what to do if you are in one.*

<figure>
  <img src="{{ '/assets/posts/oncall-nightmare-or-opportunity/01.jpg' | relative_url }}" alt="Photo by Catalin Pop on Unsplash" loading="lazy">
  <figcaption>Photo by <a href="https://unsplash.com/@catalinpop?utm_source=medium&utm_medium=referral" rel="noopener">Catalin Pop</a> on <a href="https://unsplash.com?utm_source=medium&utm_medium=referral" rel="noopener">Unsplash</a></figcaption>
</figure>

In the software engineering domain, on-call has always been one of the most dreaded weeks. The constant pressure of late-night pages or a sudden outage where you could have no idea what to do seems daunting to process.

I started working as a Software Engineer in 2017. That is when I came across the concept of on-call. It seemed peculiar that the software system that was inherently broken required manual efforts to fix it, just like something customer service folks do when you face an issue with a service or product offered. Quite often it would be that we had built the system or it was a legacy software system from a previous generation of Software Engineers who left the organisation. But given we were the service owners then, we were bestowed with the responsibility to support any issues, that occur during business operations.

But, is it something that every engineer should look forward to?

In my opinion, that is a big astounding YES!

Following are some of the reasons why this is true:

## An onboarding experience like nothing else

When I joined one of my past teams, I had no idea how the system operated at the implementation level. I was involved in a project where I got a chance to enhance how the UI gets displayed and how to make our APIs more flexible to changing requirements. But the diverse set of software systems you get to explore during on-call tenure is next to nothing imaginable.

I got the chance to dive deep into a module I had never worked on before. Eventually, I was able to have the foresight to use it in one of my next projects instead of building it from scratch, saving considerable engineering time.

## The Freedom to suggest changes

Want the freedom to suggest improvements in the system design? See a scaling issue? You would usually have dedicated bandwidth during your on-call to address these. And the secret sauce is that issues don't always keep cropping up. Even if they do, just sailing through them gives you the lens to different design improvements possible within the system.

- Are some alerts missing?
- Are some alert thresholds wrongly configured?
- Do you see some redundancy in the code while debugging?
- Do you see the opportunity to add in some unit tests or behavioural tests that could have prevented the issue from happening in the first place?

I strongly believe that this is one of the fundamental responsibilities for anyone going on-call since it helps to improve the system as a whole.

## Operating under pressure

I would not deny the fact the on-calls are usually a bit stressful in terms of the immediate customer and business impact. However, I have been fortunate to be associated with engineers who were calm and peaceful while debugging an issue.

This has led to my mindset shift in how I operate during on-call and life, as usual. Taking a step back, zooming out, and gaining a bird’s-eye view of the system allows you to debug issues more effectively, eventually becoming your default approach.

## The Chance to Work on Postmortems

Postmortems are an opportunity to work with engineering leaders and other teammates to learn from their collective experience and wisdom on how to improve the system. We go through what went wrong, and how the system can be improved as a whole.

## The Opportunity to work with multiple teams

Some of the issues need you to reach out to different teams, and understand how the upstream dependencies help to drive the operations of your teams’ service. This provides an opportunity to establish a rapport with other team members and identify cross-functional improvements that lead to a better user experience.

Let’s also discuss a methodical way to operate in case you come across an on-call issue.

The first thing to realise in case of any production incident is the fact that “**You are not alone**”. Unless you are the sole person handling an entire service or application by yourself (*for early-stage startups*), there will always be other peers, leads and engineering managers that you can always loop in and get help from. This is especially crucial as folks who face production incidents for the first time end up feeling they would be targeted and it would leave a black mark on their careers in the organisation. This, however, could not be further from the truth.

What might also help is to *shadow other experienced folks* for some time to understand how they debug a certain issue. More often than not, the issues that arise are not that unique and have a similar pattern for addressing them. This also helps in case the tooling within the organisation is unique and you need to know the different accesses required along with how to use these tools.

That said, once you have an issue to debug, understand from the team/documentation/code how the flow is organised.

- Is it served via a backend API or a cron job or consumed from a queue?
- If you have a request-id for the issue being faced, try to check if the same is being logged throughout the flow.

Always take the [first principles approach](https://www.linkedin.com/pulse/first-principles-thinking-sahil-bloom/) to debug how the flow is implemented. If it is not documented, it also helps to document the same for later reference.

If some values returned to a downstream service are incorrect, figure out how the values are being propagated/calculated from all of the upstream services and being combined.

If you face something like a 404 Not Found, try to check if some service has a wrong build deployed on it or if the code was simply not merged.

If you face latency issues, it could be a bottleneck at any of the components in the service.

- Are the queries you are firing from the application too slow? It would be worthwhile to check if you have the correct indices.
- Are you holding a database transaction for too long?
- Are the network connections waiting infinitely for a response? (*There are techniques to handle this using something known as a *[*Circuit breaker*](https://www.linkedin.com/advice/0/what-best-practices-implementing-circuit-breaker#:~:text=The%20circuit%20breaker%20pattern%20works,open%2C%20or%20half%2Dopen.)*, but we’ll discuss that in another article.*)
- Or is the process stuck in a deadlock?

The above steps just highlight some of the guiding principles while debugging an issue, but almost everything that you learn in computer science can come into play when you debug an issue. This is why I love on-call tenure ❤

It gives you the chance to exercise your mental muscle on what could have gone wrong!

It is a process of diving deep into the implementation-level details to understand what is the core issue. Once you come across the root cause, the priority is to *put the fire out* so that the customer gets unblocked. This also depends on the criticality of the issue.

Depending on the same, you would come up with a:

- *a quick fix* that solves the user’s issue
- *long-term fix *to prevent the issue from happening in the first place

If the issue led to an outage and had a considerable business impact, you should create a [postmortem](https://www.atlassian.com/incident-management/postmortem/templates) to document the entire timeline of the outage along with steps to solve it. Having a detailed discussion about it with the rest of the team members provides the opportunity for brainstorming making the system health much better.

We’ll discuss the core tenets of a good postmortem in one of our next articles. If you find this interesting, consider clicking the ‘Follow’ button to join me on my journey of learning, exploration, and delving into the expansive world of computer science and beyond. ❤️

---

*Originally published on [Medium](https://medium.com/engineering-with-karan/oncall-a-nightmare-or-golden-opportunity-a49662bb8c51).*
