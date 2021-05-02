---
layout: "layouts/post-with-toc.njk"
title: "Software Engineering: Web Development"
description: "Reflection on the state of web development or the story of Media Artists AG."
creationdate: 2021-05-02T10:18:00+01:00
date: 2021-05-02T10:18:00+01:00
keywords: software,engineering,web-development,HTML,JScript,CSS,AJAX,SPA,single-page-applications,JSON,CQS,CMS
tags: ['post']
# eleventyExcludeFromCollections: true
---

This blog post is part of the [Odysseys in Software Engineering](../series-odysseys-in-software-engineering) series.

## Rational

In my first year at university I studied physics and computer science in parallel. After my first year I decided to stop the computer science lectures
and start working in a start-up instead. This was 1997. This was the time of the [dot-com boom](https://en.wikipedia.org/wiki/Dot-com_bubble), where
everybody wanted to have a place on the internet, nobody knew what the internat was, and we gave them the internet. The start-up was called Media
Artists AG. There were the two founders and I was their first employee.

In todays terminology, the product idea was to create a [content management system (CMS)](https://en.wikipedia.org/wiki/Content_management_system) for
big German publishers. And as the internet and the web were the big things the natural choice was to build this application in web native technolgies
like HTML and JavaScript.

This was also the time of the first [browser war](https://en.wikipedia.org/wiki/Browser_wars), the competition for dominance in the usage share of
Microsoft's Internet Explorer against Netscape's Navigator. There was basically no compatibility between browsers and even minor version upgrades of
the same browser were breaking backward compatibility in substantial ways. [Internet Explorer 4](https://en.wikipedia.org/wiki/Internet_Explorer_4)
and its dialect of [JavaScript](https://en.wikipedia.org/wiki/JavaScript), called [JScript](https://en.wikipedia.org/wiki/JScript), were the first
technologies that enabled, what is now called a [single-page application (SPA)](https://en.wikipedia.org/wiki/Single-page_application). I started to
work on early beta versions of Internet Explorer 4 as Media Artists AG was tasked to lead the road-show of Microsoft in Europe for the market
introduction of Internet Explorer 4. Every minor version upgrade of the beta version of Internet Explorer 4 meant that nothing was working any longer,
because every minor version upgrade broke backward compatibility in substantial ways.

We used our experience and ingenuity to create a [single-page application (SPA)](https://en.wikipedia.org/wiki/Single-page_application) to be used by
editors at big German publishers for updating news articles on the publisher's web-sites. The application (mis-)used hidden frames to communicate with
the server and the server generated valid JScript code to communicate data-structures back to the application. This way we saved the need to write a
parser in contrast to later implementations that used XML as the "wire-format".  [Cross-site scripting
(XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) and the browser protection mechanisms against it were no worry at the time, so that you could freely
exchange data from one frame to another. This was basically, what later would be called [Asynchronous JavaScript and XML
(AJAX)](https://en.wikipedia.org/wiki/Ajax_(programming)) and [JavaScript Object Notation (JSON)](https://en.wikipedia.org/wiki/JSON),
e.g. technologies that were only later during the [Web 2.0](https://en.wikipedia.org/wiki/Web_2.0) movement gaining more widespread use.

While all of this was working fine, the incompatibilities between different versions of Internet Explorer 4 were horrific. Even after the beta phase
for Internet Explorer 4 ended and Internet Explorer 4 was supposed to be stable, every (even minor) update brought countless incompatibilities that we
had to account for in our code base with a lot of "if-then-else" logic handling different version numbers of IE4.

This experience was so painful for me that for a long time I did not touch front-end technolgies again and preferred to stay on the back-end. Only in
2019, when my daughter had an idea for an own [social start-up](https://en.wikipedia.org/wiki/Social_entrepreneurship), I decided it was time to
revisit the topic once again. So, what follows, is the story of my re-discovery of web technologies with a 20 year break in between. And just to make
the above story about Media Artists AG complete: we switched from HTML and JScript to Java, where I worked in this context with early versions of
[Java Swing](https://en.wikipedia.org/wiki/Swing_(Java)), before it became an integral part of the JDK. At least Java Swing stayed backward compatible
between releases so that we could focus on the product rather than on incompatibilities.

## The App

At the moment you can find the prototype web-app at [https://joto-prekt-dev.web.app](https://joto-prekt-dev.web.app). We decided to use
[Firebase](https://firebase.google.com/) for the back-end, because I was curious about the
[serverless](https://en.wikipedia.org/wiki/Serverless_computing) movement and we did not want to take care of server administration. We selected
[React](https://en.wikipedia.org/wiki/React_(JavaScript_library)), because the functional nature was appealing to me. We started originally with
[JavaScript](https://en.wikipedia.org/wiki/JavaScript), but soon switched to [TypeScript](https://en.wikipedia.org/wiki/TypeScript).

## The Good

The biggest positive surprise was [TypeScript](https://en.wikipedia.org/wiki/TypeScript). I could not imagine that a retrofitted type system could
work that well, especially after my disappointments with type systems in the
[python](https://en.wikipedia.org/wiki/Python_(programming_language)#Typing) world. Switching from JavaScript to TypeScript improved the stability and
reduced the amount of tests we had to write by an order of magnitude. It also made the IDE support for refactoring and introspection so much more
powerful.

- bootstrap

- react
-- iterative development

- serverless security rules

## The Bad

- layers on top of layers of indirection
-- babel
-- polyfills
-- scss


## And the Ugly

- constant need for security fixes and no clear path forward.
- "speed" at which everything needs to move.
- still no agreed best practice approach, react (next.js, gatsby, create-react-app), vue.js, angular, polymer
-- bike shedding

## Summary

- web components
