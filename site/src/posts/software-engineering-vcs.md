---
layout: "layouts/post-with-toc.njk"
title: "Software Engineering: Version Control Systems (VCS)"
description: "Using a VCS in software development is standard by now but may add more complexities than you asked for."
creationdate: 2021-06-13T14:39:00+02:00
date: 2021-06-13T14:39:00+02:00
keywords: software,engineering,VCS,version-control-system,git,svn,cvs,hg
tags: ['post']
# eleventyExcludeFromCollections: true
---

This blog post is part of the [Odysseys in Software Engineering](../series-odysseys-in-software-engineering) series.

## Context

Only recently it happened in the project I am currently involved in that the team had a 1.5h presentation and discussion on how to "properly" use
[git](https://en.wikipedia.org/wiki/Git) in their project. This reminded me about a long-standing grudge I have with `git`. It is too complex and makes
things more difficult than they need to be.

## Git

While this blog post is not about `git` you have to understand a bit about its internals to understand the difficulties it creates. The best
explanation of the `git` internals I've seen so far is [InfoQ: The Git Parable](https://www.infoq.com/presentations/git-details/) by Johan Herland. I
will not repeat what he explains much better than I could, but if you don't know (enough about) the `git` internals be sure to watch the video.

As `git` is a distributed version control system (DVCS) it comes as not surprise that a lot of its internals resemble very much CRDTs ([Conflict Free
Replicated Data-Types](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)). The best introductory paper to CRDTs I know is
[Conflict-Free Replicated Data Types](https://hal.inria.fr/hal-00932836/file/CRDTs_SSS-2011.pdf) by Marc Shapiro at al.

## The situation before git

There was a time before `git` became popular and dominated the VCS space. When [SourceForge](https://en.wikipedia.org/wiki/SourceForge) was founded in
1999 it started out with using [CVS](https://en.wikipedia.org/wiki/Concurrent_Versions_System) and later added support for
[SVN](https://en.wikipedia.org/wiki/Apache_Subversion). In the late 1990s many software development teams did not even know about the existence of VCS
systems and used a simple directory structure to manage their code. Luckily we've moved far beyond this and using a VCS in a software development
project is standard by now.

In the early days, quality assurance (QA) in software development projects, was severely under-developed. This changed only slowly with the advent of
Test-Driven Development ([TDD](https://en.wikipedia.org/wiki/Test-driven_development)) and the [realization that QA was primarily the responsibility
of the development team](https://github.com/97-things/97-things-every-programmer-should-know/blob/master/en/thing_67/README.md) and not of an
independent QA team relying on manual testing.

The observation that integrating code developed by different contributors caused major headaches if these contributors did not regularly integrate
their efforts lead to the habit of continuous integration ([CI](https://en.wikipedia.org/wiki/Continuous_integration)), a practice of merging all
developers' working copies to a shared mainline several times a day. This process was then supported by a so called continuous integration system
(CI-server) that monitored commits into the version control system and after every commit built the software and ran all automated tests against
it. If a test case failed an integration problem was detected and an e-mail was sent to the developer who was responsible for the commit that caused
the failure.

There was a simple protocol that every developer had to follow: at least once per day do the following:
1. fetch all changes from the central code repository
1. take care of all merge conflicts detected by the VCS (this is what continuous integration means)
1. run all the (fast) automted tests locally on your machine and fix any problems detected
1. and only if all the above was successful then commit to trunk/master/mainline (or however you called it in your project).
1. then the CI-system verified independently, that a frech check-out plus build plus running all automated tests worked fine as a secondary safety net.
1. once per night all the slow tests were run like load, stress, capacity, ... tests.

Everybody worked mostly on the mainline and you had a simple linear history. With the "blame" functionality of your VCS you could find out who was
responsible for which line of code if you needed to.

You only created branches for releases every couple of weeks and on the release branches only bug-fixes were allowed. The bug fixes from the release
branch were merged back into the mainline to make sure that all bug fixes are also present in the mainline. Some people were taking continuous
integration even one step further to continuous delivery, meaning that the CI-system pushed all changes automatically into production if the tests
were running fine.

<object data="/img/branch-and-merge-strategy.svg" type="image/svg+xml" style="max-width: 100%">
<img src="/img/branch-and-merge-strategy.svg" alt="branch and merge strategy">
</object>


If you worked in a bigger organization all of the related code was in a single repository and every commit triggered all of the CI activities for all
parts, so that you always had a consistent code base across the organization. Only external libraries would be versioned and integrated into the code
base via a dependency manager (often an integral part of the build system) as a kind of [bill of
materials](https://en.wikipedia.org/wiki/Bill_of_materials). There is a good paper from Google that enumerates the benefits of this approach [Why
Google Stores Billions of Lines of Code in a Single
Repository](https://cacm.acm.org/magazines/2016/7/204032-why-google-stores-billions-of-lines-of-code-in-a-single-repository/fulltext). Google has
developed its own VCS, but for smaller organizations the same principles can easily be implemented via a system like
[SVN](https://en.wikipedia.org/wiki/Apache_Subversion).

## The situation recently (now)

I admire `git` as a technology. And I understand why very decentralized projects like the [Linux](https://en.wikipedia.org/wiki/Linux) kernel depend
on the advanced features of a decentralized version control system like `git`. I also like very much the ease and simplicity with which you can put a
local project under version control by a simple `git init` rather than needing to set-up somewhere a server component. I really do see all of these
points. But, in my opinion, the majority of projects developed in-house in an organization by a dedicated in-house software engineering team, would be
better off following the guiding principles in [Why Google Stores Billions of Lines of Code in a Single
Repository](https://cacm.acm.org/magazines/2016/7/204032-why-google-stores-billions-of-lines-of-code-in-a-single-repository/fulltext) and rather using
something like `SVN` rather than `git`.

`git` is complex and forces developers to think about, in principle irrelevant, technical details like should you use [merge
vs. rebase](https://www.atlassian.com/git/tutorials/merging-vs-rebasing) or similar. And once you go down the route of `rebase` in order to keep the
version history "nicely linear and clean" you have to live with [rewriting history](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History) in
cases where you collaborate with other developers on public feature branches. See for example [Git Rebase: Don’t be Afraid of the Force
(Push)](https://blog.verslu.is/git/git-rebase/). It reads:

> Recap
>
> While a git rebase might sound scary at first, it’s not so bad when you have done it a couple of times.

Speaking of which: `feature branches`: in the past, feature branches were frowned upon, because feature branches are intrinsically against the spirit
of continuous integration. I still don't see how we ever ended up in a world where people believe that feature branches would be a step forward. They
are a step backward. I understand, why in an open-source project, where you don't know the people who will send patches to you, you will want to have
a QA step in between like a [pull
request](https://docs.github.com/en/github/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests). But
how on earth do you want in an in-house model let feature branches diverge from mainline only to amplify the integration issues down the road. In
addition, a regular commit of what you do into mainline, will make other developers aware of it in case that you touch something they're also working
on. It forces the team to discuss and make sure that different aspects of the code-base work together rather than against each-other. In two words:
[continuous integration](https://en.wikipedia.org/wiki/Continuous_integration)!

> <span style="font-size:smaller"> Just as a side remark: continuous integration is tightly coupled to having a good test suite. There are lurking a
> lot of pitfalls on the path to a good test suite. I recommend the video [TDD: Where Did It All Go
> Wrong?](https://www.infoq.com/presentations/tdd-original) by Ian Cooper. Despite the sound of its title it is pro TDD. While I don't care too much
> about test-first or test-later, I care very much about having a good test suite that helps productivity rather than hampering productivity.</span>

In the past couple of months I see more and more (in-house) projects switching to a [monorepo](https://en.wikipedia.org/wiki/Monorepo) model, because
developers start to understand that working in many small repositories will lead to [dependency
hell](https://en.wikipedia.org/wiki/Dependency_hell). But why did people start to work in many small repositories in the first place? Because `git` is
not ideal for a single repository approach. One of my main complaints about `git` is that it lacks a "deep checkout" feature, e.g. that you can check
out sub-directories of the top level directory. A feature that is useful if a developer for the moment wants to work on a more focused aspect of the
code base, but the CI/CD pipeline still should check the overall consistency of everything and the version control system makes sure that you have one
consistent view of everything. The word `monorepo` did not even exist in the past (not in my vocabulary anyway), because it was the natural thing to
do, to work in a `monorepo`. Nobody needed a word for the concept.

Regularly, I feel, that people try to find solutions to problems that they wouldn't have had if they wouldn't have used `git` in the first
place. That's a typical sign of accidental vs. essential complexity (see [Out of the Tar Pit](http://curtclifton.net/papers/MoseleyMarks06a.pdf) by
Ben Moseley and Peter Marks). In my observations, in in-house development projects, `git` causes more accidental complexity than it benefits the
project. It is a net negative rather than a net positive.

The fact that junior developers are starting to ask in interview situations about which version control sytem you're using and refusing to work for
the project if you use anything other than `git` is taking the irrationality to the extreme. Which version control system you are using in your
project should be the result of hard-headed engineering reasons rather than the need to follow fashion and trends. On the positive side, the just
mentioned interviewing attitude makes it at least easy for the hiring manager to see whether a developer cares about rational reasoning or rather
prefers to follow fashion or focus on perceived career-value. If you insist on gaining experience in `git` then just join one of the many open-source
projects out there that are using `git`.

## Summary

While I am talking above about `git` it is not the tool, but the version control model, that is at the heart of my issue with the current state of
affairs. `git` just happened to conquer the whole distributed versions control market and tools that had some user base in the past like
[Mercurial](https://en.wikipedia.org/wiki/Mercurial) have been marginalized. Especially, for in-house software engineering projects, I advocate to at
least review the reasoning in [Why Google Stores Billions of Lines of Code in a Single
Repository](https://cacm.acm.org/magazines/2016/7/204032-why-google-stores-billions-of-lines-of-code-in-a-single-repository/fulltext) and base your
choice on hard headed engineering reasons. If you care about productivity then you will care about [accidental vs. essential
complexity](http://curtclifton.net/papers/MoseleyMarks06a.pdf) and you will want to squeeze accidental complexity out of your project.
