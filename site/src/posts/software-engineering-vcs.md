---
layout: "layouts/post-with-toc.njk"
title: "Software Engineering: Version Control Systems (VCS)"
description: "Using a VCS in software development is standard by now but may add more complexities than you asked for."
creationdate: 2021-05-16T10:18:00+01:00
date: 2021-06-04T14:39:00+02:00
keywords: software,engineering,VCS,version-control-system,git,svn,cvs
tags: ['post']
# eleventyExcludeFromCollections: true
---

This blog post is part of the [Odysseys in Software Engineering](../series-odysseys-in-software-engineering) series.

## Context

Only recently it happened in the project I am currently involved in that the team had a 1.5h presentation and discussion on how to "properly" use
[git](https://en.wikipedia.org/wiki/Git) in their project. This reminded me about a long-standing grudge I have with git. It is too complex and makes
things more difficult than they need to be.

## Git

While this blog post is not about `git` you have to understand a bit about its internals to understand the difficulties it creates. The best
explanation of the `git` internals I've seen so far is [InfoQ: The Git Parable](https://www.infoq.com/presentations/git-details/) by Johan Herland. I
will not repeat what he explains much better than I could, but if you don't know (enough about) the `git` internals be sure to watch it.

As `git` is a distributed version control system (DVCS) it comes as not surprise that a lot of its internals resemble very much CRDTs ([Conflict Free
Replicated Data-Types](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)). The best introductory paper to CRDTs I know of is
[Conflict-Free Replicated Data Types](https://hal.inria.fr/hal-00932836/file/CRDTs_SSS-2011.pdf) by Marc Shapiro at al.

## The situation before git

There was a time before `git` became popular and dominated the VCS space. When [SourceForge](https://en.wikipedia.org/wiki/SourceForge) was founded in
1999 it started out with using [CVS](https://en.wikipedia.org/wiki/Concurrent_Versions_System) and later added support for
[SVN](https://en.wikipedia.org/wiki/Apache_Subversion). In the late 1990s many software development teams did not even know about the existence of VCS
systems and used a simple directory structure to manage their code. Luckily we've moved far beyond this and using a VCS in a software development
project is standard by now.

In the early days quality assurance (QA) in software development projects was severely under developed. This changed only slowly with the advent of
Test-Driven Development ([TDD](https://en.wikipedia.org/wiki/Test-driven_development)) and the realization that QA was primarily the responsibility of
the development team and not of an independent QA team relying on manual texting.

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

XXX picture XXX

If you worked in a bigger organization all of the related code was in a single repository and every commit triggered all of the CI activities for all
parts, so that you always had a consistent code base across the organization. Only external libraries would be versioned and integrated into the code
base via a dependency manager (often an integral part of the build system) as a kind of [bill of
materials](https://en.wikipedia.org/wiki/Bill_of_materials). There is a good paper from Google that enumerates the benefits of this approach [Why
Google Stores Billions of Lines of Code in a Single
Repository](https://cacm.acm.org/magazines/2016/7/204032-why-google-stores-billions-of-lines-of-code-in-a-single-repository/fulltext). Google has
developed its own VCS, but for smaller organizations the same principles can easily be implemented via a system like
[SVN](https://en.wikipedia.org/wiki/Apache_Subversion).



## Related Content

* [Out of the Tar Pit](http://curtclifton.net/papers/MoseleyMarks06a.pdf) by Ben Moseley and Peter Marks: accidental vs. essential complexity
* [TDD: Where Did It All Go Wrong?](https://www.infoq.com/presentations/tdd-original) by Ian Cooper.
* [monorepo](https://en.wikipedia.org/wiki/Monorepo)
