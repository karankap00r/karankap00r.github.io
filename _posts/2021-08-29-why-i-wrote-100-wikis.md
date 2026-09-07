---
title: "Why I wrote 100 wikis, and how it mattered"
date: 2021-08-29
published: true   # set to false to hide this post everywhere
description: "Documentation is the part of engineering that most often gets skipped. After writing a hundred wikis, I look at what they changed for the team and for me, and how to make writing them a normal part of shipping."
tags: [engineering, documentation, productivity]
link: https://medium.com/engineering-with-karan/why-i-wrote-100-wikis-and-how-it-mattered-a163a1b41f00
source: Medium
---

<figure>
  <img src="{{ '/assets/posts/why-i-wrote-100-wikis/01.jpg' | relative_url }}" alt="Photo by Sigmund on Unsplash" loading="lazy">
  <figcaption>Photo by <a href="https://unsplash.com/@sigmund?utm_source=medium&utm_medium=referral" rel="noopener">Sigmund</a> on <a href="https://unsplash.com?utm_source=medium&utm_medium=referral" rel="noopener">Unsplash</a></figcaption>
</figure>

As developers, we love building features that bring about an improvement in the user-facing product. Several others of us endure building core frameworks that boost developer productivity. While the core pieces are design and implementation, documentation is a crucial part of the process that often gets missed.

My journey with writing documentation started with a software engineering project I was working on. I felt that the codebase was huge, and the software system was quite complex, leaving me battling to connect the dots. Overwhelmed by the sheer volume of what certain blocks of code and modules were doing, I came across a book called “[*Working effectively with legacy codebases*](https://amzn.to/2XYF6Jc)”. While the book by Robert Martin had a lot to gain from, with some years as a Software Engineer, I have observed that the duration after which a code becomes legacy is shortening, owing to the increasingly agile nature of organizations. To build out more features, the engineering and product teams ship out tens of thousands of lines of code every quarter, and it takes no more than a couple of such quarters for a codebase to become legacy software. For someone joining the team at such a point, it becomes crucial that the system has documentation and tests to support it.

Another form of such artifacts is documentation in the form of wikis. My first wiki was an API contract for a project, where we needed to integrate with the mobile engineering team. I had several observations when I published it, which bolstered its importance. Following are my two cents on why I feel documentation is such an integral part of Software Engineering.

### Documents are a form of automation

I have often been asked by engineers joining the organization about getting started with the software system. Setting up meetings for going in-depth with every newly joining engineer is often tedious. Wikis and documentations, in this case, have been extremely useful for automating the process of knowledge sharing. It is a one-shot place you can redirect engineers to, and it saves time for both parties. These wikis can then be improved based on feedback.

### Documents don’t always need to be extremely technical

As software developers, we often assume that the work we do needs to be extremely technical. However, it could even be about how to make a process better. We might want to present a better way of managing on-calls, or how we can onboard engineers better. These could have a butterfly effect on how several other technical details are organized.

One of the memorable documents that I came across was a clean slate for ideas on improving the software system we were working on. It brought in several novel ideas that were waiting to be put up, and the wiki provided a platform for the same.

### Documents don’t need to create. They can simply document.

We can document how a certain installation needs to be done, what are the processes to gain certain accesses. The end goal is to not write something novel. (*though that could have its advantages). *It is about making information available at a much faster pace to its consumer by automating the process of knowledge sharing through a go-to place.

### Documents can help you to refine your thought process

I recall when I was working on building a generic and scalable retry worker. Though the design details are for another day, I tried portraying my initial thoughts in a document and opened it up for comments. What I wrote initially in the document was quite different from what we ended up implementing. However, getting started with a document provided a platform for ideas to grow and improve upon the initial design. This discussion and feedback loop is where a lot of the improvement and learning happens.

### Documents reduce the turnaround time for projects rather than increasing it

When I started my journey with software engineering, I had a perception that writing the stuff down was much more time-consuming than explaining the same on a whiteboard. Often our contracts missed out on some key implementation details. As we started documenting the details to greater clarity, we felt that there was lesser time spent on follow-up discussions, unintended confusions, and re-architecting entire modules. This reduced the turnaround time and boosted developer productivity.

### Documentations are eternal

When a certain project is in an active state, the folks working on the same are the ones to reach out to know more about it, or how it could affect the rest of the software system. However, with time the team moves to other projects and sometimes individuals move to other organizations. In these cases, not having clear documentation is a recipe for disaster. Wikis might help in providing greater insights, even without the core team that worked on the same. These are persistent records that help scale the number of features we launch, all whilst maintaining support for what is already rolled out on production.

In my opinion, documentation is as closely knit to the software system as the code used to implement it and becomes extremely important as organizations scale.

Some follow-up reads are listed below for curious folks:

- [Documentation as a code](https://www.writethedocs.org/guide/docs-as-code/)
- [Writing good documentation](https://www.writethedocs.org/guide/writing/beginners-guide-to-docs/)

---

*Originally published on [Medium](https://medium.com/engineering-with-karan/why-i-wrote-100-wikis-and-how-it-mattered-a163a1b41f00).*
