---
layout: "layouts/post-with-toc.njk"
title: "Software Engineering: Web Development"
description: "Reflection on the state of web development or the story of Media Artists AG (1997)."
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
[React](https://en.wikipedia.org/wiki/React_(JavaScript_library)), because the functional nature appealed to me. We started originally with
[JavaScript](https://en.wikipedia.org/wiki/JavaScript), but soon switched to [TypeScript](https://en.wikipedia.org/wiki/TypeScript).

## The Good

The biggest positive surprise was [TypeScript](https://en.wikipedia.org/wiki/TypeScript). I could not imagine that a retrofitted type system could
work that well, especially after my disappointments with type systems in the
[python](https://en.wikipedia.org/wiki/Python_(programming_language)#Typing) world. Switching from JavaScript to TypeScript improved the stability and
reduced the amount of tests we had to write by an order of magnitude. It also made the IDE support for refactoring and introspection so much more
powerful.

The package management system like [npm](https://www.npmjs.com/) I count as a positive, too. I am aware that people are sometimes critical about
package management systems and complain that they "download the whole internet". But managing external libraries in the past was always a major pain!
You had to download them from somewhere, mostly as a zip archive[^sourceforge], and then keep track of changes made there yourself. In addition you
had to identify and download all the transitive dependencies yourself. A package system makes all of that easier.

Another nice encounter was [bootstrap](https://getbootstrap.com/): finally some useful defaults for a starting point that you can build upon. But I
was a bit disappointed by the state of [CSS](https://en.wikipedia.org/wiki/CSS) in general. CSS existed already in 1997 and the improvements are
limited. Why are pre-processors like [sass](https://sass-lang.com/) or [less](https://lesscss.org/) still needed? Why is that not already part of the
core standard language?

I also enjoyed working with [react](https://reactjs.org/) due to its functional nature. You take one state and transform it into another state. Nice
and clean. I always thought that UIs should be built like they are in computer games, e.g. a big while loop where you take inputs from your periphery,
update the game state and draw the scene as a derivative of that game state. Not these tangled balls of mud with UI state scattered over your whole
code base and event chains ending in infinite loops.

I also was positively surprised with the tooling around react like the [React Developer
Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) and other tooling and IDE
integration. That made work more productive.

While this is not part of the core web technologies and I am still not 100% sure if I should count it as a positive I found the serverless [security
rules](https://firebase.google.com/docs/rules) intriguing. I always was wondering how a serverless infrastructure would handle these security aspects
in the absence of any protected and safe secure area like the backend. But writing and testing these rules and being sure that they finally achieve
the intended goal was a major headache. I am not sure if people will in the future come up with better solutions perhaps?

- state management redux, F5 reload and browser store

- chrome dev tools and debugger.

## The Bad

The "bad" is easily summarized as "layers on top of layers of indirection" (or [turtles all the way
down](https://en.wikipedia.org/wiki/Turtles_all_the_way_down)). It took me quite a lot of time to understand what is (roughly) going on. I won't
pretend that I understand all of it.

It starts with [babel](https://babeljs.io/) and [webpack](https://webpack.js.org/). Actually, we used [Create React
App](https://create-react-app.dev/), to configure a "black box" webpack setup for us and it took me quite some time to understand what was happening
behind the scenes. Due to the still existing incompatibilities between browsers as documented by sites like [Can I use](https://caniuse.com/) the
"build" machinery of a web application as to jump through several hoops to make the result work the same way on whatever browser the user uses. One
aspect of it are [polyfills](https://en.wikipedia.org/wiki/Polyfill_(programming)), which is code that implements a feature on web browsers that do
not support the feature. Then you have the compilation from TypeScript to a broadly accepted version of
[ECMAScript](https://en.wikipedia.org/wiki/ECMAScript), e.g. ES5 or so. I guess, in principle, the TypeScript compiler should be able to handle that,
but somehow babel, a JavaScript to JavaScript compiler, is still in the game. And finally all of the resulting artifacts have to be packaged in as
small as possible pieces of code that can be loaded incrementally to not burden the start-up time of the web page. This aspect is called [code
splitting](https://developer.mozilla.org/en-US/docs/Glossary/Code_splitting).

> <span style="font-size:smaller">As a side remark: recently I had a look at some [Angular](https://angular.io/) code and noticed the many
> annotations. I was not sure which part of this layers on top of layers of indirection is taking care of converting the annotations into actual
> JavaScript and how. I learned that [Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html), as annotations are called in the
> JavaScript world, are a stage 2 proposal for JavaScript and are available as an experimental feature of TypeScript. It is astonishing, that
> experimental features are promoted as core features of a widely used framework like Angular.</span>


## And the Ugly

- constant need for security fixes and no clear path forward.
- "speed" at which everything needs to move.
- still no agreed best practice approach, react (next.js, gatsby, create-react-app), vue.js, angular, polymer
-- bike shedding

## Summary

- web components

-> native apps, edge computing

## Footnotes

[^sourceforge]: keep in mind that [SourceForge](https://en.wikipedia.org/wiki/SourceForge) was only founded in 1999 and did not exist yet in 1997.
