---
layout: "layouts/post-with-toc.njk"
title: "Software Engineering: Web Development"
description: "Reflection on the state of web development or the story of Media Artists AG (1997)."
creationdate: 2021-05-16T10:18:00+01:00
date: 2021-05-16T10:18:00+01:00
keywords: software,engineering,web-development,HTML,JScript,CSS,AJAX,SPA,single-page-applications,JSON,CQS,CMS
tags: ['post']
# eleventyExcludeFromCollections: true
---

This blog post is part of the [Odysseys in Software Engineering](../series-odysseys-in-software-engineering) series.

## Setting the Stage

In my first year at university, I studied physics and computer science in parallel. After my first year I decided to stop the computer science lectures
and start working in a start-up instead. This was 1997. This was the time of the [dot-com boom](https://en.wikipedia.org/wiki/Dot-com_bubble), where
everybody wanted to have a place on the internet, nobody knew what the internet was, and we gave them the internet. The start-up was called Media
Artists AG. There were the two founders and I was their first employee.

In today's terminology, the product idea was to create a [content management system (CMS)](https://en.wikipedia.org/wiki/Content_management_system) for
big German publishers. And as the internet and the web were the big things the natural choice was to build this application in web native technologies
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

This experience was so painful for me that for a long time I did not touch front-end technologies again and preferred to stay on the back-end. Only in
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

The package management system like [npm](https://www.npmjs.com/) I also count as a positive. I am aware that people are sometimes critical about
package management systems and complain that they "download the whole internet". But managing external libraries in the past was always a major pain!
You had to download them from somewhere, mostly as a zip archive[^sourceforge], and then keep track of changes made there yourself. In addition you
had to identify and download all the transitive dependencies yourself. A package system makes all of that a repeatable and stable process.

Another nice encounter was [bootstrap](https://getbootstrap.com/): finally, some useful defaults for a starting point that you can build upon. But I
was a bit disappointed by the state of [CSS](https://en.wikipedia.org/wiki/CSS) in general. CSS existed already in 1997 and the improvements are
limited. Why are pre-processors like [sass](https://sass-lang.com/) or [less](https://lesscss.org/) still needed? Why is that not already part of the
core standard language?

I also enjoyed working with [react](https://reactjs.org/) due to its functional nature. You take one state and transform it into another state. Nice
and clean. I always thought that UIs should be built like they are in computer games, e.g. a big while loop where you take inputs from your periphery,
update the game state and draw the scene as a derivative of that game state. This is the exact opposite of these tangled balls of mud with UI state
scattered over your whole codebase and event chains ending in infinite loops. While this is not one-to-one related to react the state management via
[redux](https://react-redux.js.org/) together with [redux-persist](https://github.com/rt2zz/redux-persist) to handle situations where users
inadvertently close tabs or press F5 also felt like an improvement.

While this is not part of the core web technologies and I am still not 100% sure if I should count it as a positive, I found the serverless [security
rules](https://firebase.google.com/docs/rules) intriguing. I always was wondering how a serverless infrastructure would handle these security aspects
in the absence of any protected and safe secure area like the backend. But writing and testing these rules and being sure that they finally achieve
the intended goal was a major headache. I am not sure if people will in the future come up with better solutions perhaps?

The chrome browser [dev tools](https://developer.chrome.com/docs/devtools/) together with the debugger and the [JavaScript Source
Maps](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map) and further plug-ins like [React Developer
Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) and [Redux
DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en) made it relatively straight forward to
introspect what was going on in the browser.

## The Bad

The "bad" is easily summarized as "layers on top of layers of indirection" (or [turtles all the way
down](https://en.wikipedia.org/wiki/Turtles_all_the_way_down)). It took me quite a lot of time to understand what is (roughly) going on. I won't
pretend that I understand it all.

It starts with [babel](https://babeljs.io/)[^swc] and [webpack](https://webpack.js.org/). Actually, we used [Create React
App](https://create-react-app.dev/), to configure a "black box" webpack setup for us and it took me quite some time to understand what was happening
behind the scenes. Due to the still existing incompatibilities between browsers as documented by sites like [Can I use](https://caniuse.com/) the
"build" machinery of a web application has to jump through several hoops to make the result work the same way on whatever browser the user uses. One
aspect of it are [polyfills](https://en.wikipedia.org/wiki/Polyfill_(programming)), which is code that implements a feature on web browsers that do
not support the feature. Then you have the compilation from TypeScript to a broadly accepted version of
[ECMAScript](https://en.wikipedia.org/wiki/ECMAScript), e.g. ES5 or so. I guess, in principle, the TypeScript compiler should be able to handle that,
but somehow babel, a JavaScript to JavaScript compiler, is still in the game. And finally, all of the resulting artifacts have to be packaged in as
small as possible pieces of code that can be loaded incrementally to not burden the start-up time of the web page. This aspect is called [code
splitting](https://developer.mozilla.org/en-US/docs/Glossary/Code_splitting).

> <span style="font-size:smaller">As a side remark: recently I had a look at some [Angular](https://angular.io/) code and noticed the many
> annotations. I was not sure which part of this layers on top of layers of indirection is taking care of converting the annotations into actual
> JavaScript and how. I learned that [Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html), as annotations are called in the
> JavaScript world, are a stage 2 proposal for JavaScript and are available as an experimental feature of TypeScript. It is astonishing, that
> experimental features are promoted as core features of a widely used framework like Angular.</span>


## And the Ugly

The ugly pieces are the "speed" at which everything needs to move in the JavaScript/Web world and especially the constant need for security fixes
without a clear path forward on how to deal with those fixes.

People, often say, that computer science is a young field and therefore a lot of progress is still being made. This also nurtures the narrative of the
fast-paced technological progress and the constant need for learning and staying atop of the curve to not become irrelevant. I would argue that most
relevant work in computer science was done before the 2000s (with a few exceptions like
[DNNs](https://en.wikipedia.org/wiki/Deep_learning#Deep_neural_networks) and similar) and what we see as fast-paced technological progress is mostly
[bike-shedding](https://en.wikipedia.org/wiki/Law_of_triviality). Typically, for the difficult problems, there is only one way how to do it. For the
trivial problems, there are 100s of ways on how to do it and that invites the myriads of web frameworks and short-lived hypes out there. I still
remember when [GWT](http://www.gwtproject.org/) was the hottest thing on the planet. Then it was dropped by Google and most of its users. Then came
"newer technologies" like [Polymer](https://polymer-library.polymer-project.org/3.0/docs/devguide/feature-overview),
[AngularJS](https://angularjs.org/), [Flutter](https://flutter.dev/) with [Dart](https://dart.dev/), [Angular](https://angular.io/), ... and this is
only an enumeration of Google technologies. The same is true in the Facebook/React camp with [Gatsby](https://www.gatsbyjs.com/),
[next.js](https://nextjs.org/), [Create React App](https://create-react-app.dev/), ... and that does not even touch yet the 10'000s of other web
frameworks out there.

Why are there still no agreed best practice approaches out there? I may exaggerate here, but as far as I can tell it looks to me as if you have to
throw away your front-end every 1 to 2 years, only because the web framework on which you originally built your site was abandoned by its creators for
no other good reason than the next fad. How do you want to build stable and production ready software that delivers business value like that?

Especially the state of the constant security alerts worries me. There are "solutions" out there like GitHub's
[Dependabot](https://github.com/features/security) that at least warn you about known vulnerabilities, but the process for how you're supposed to deal
with those is still not clear to me? I tried to read quite a bit about it and there are articles like [How to fix Security Vulnerabilities in NPM
Dependencies in 3 Minutes](https://hackernoon.com/how-fix-security-vulnerabilities-in-npm-dependencies-in-3-minutes-rq9g3y7u) out there, but following
these recipes nearly never leads to the wanted result and you're left with the message:

> `X vulnerabilities required manual review and could not be updated`

The one thing that seems to at least sometimes do the right thing is
[npm-check-updates](https://github.com/raineorshine/npm-check-updates). But why is there no canonical and well described process that every front-end
developer knows by heart and can apply in their sleep? At least I did not find anything like that.

I would even argue that most of the (security) problems in web applications stem from the fact that you use a web application in the first place. Why
did [rich-clients](https://en.wikipedia.org/wiki/Rich_client) on desktop computers fall so much out of favour? On the mobile platforms like iOS and
Android native rich-clients are still very common, but on a desktop computer rich-clients are a threatened species. In a rich-client you don't have to
worry about [XSS](https://owasp.org/www-community/attacks/xss/) or what you store or mustn't store in the browser's
[localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage). You know that the operating system is making sure that no other
process has unauthorized access to your process memory. In addition rich-clients could be so much more responsive and productive. Have you recently
worked with O365 or the cloud version of Atlassian tools or any other "cloud native" application for that matter? While waiting for the hundreds of
little background requests to make your application useable my feet fall asleep. This was not the case in the past when the local rich-client
application was actually doing something useful like allowing you to start working immediately and syncing in the background with some server.

Perhaps it will help if we introduce a new buzz word like [edge computing](https://en.wikipedia.org/wiki/Edge_computing) to make something we did do 20
years ago sound like technological progress.



## Summary

All in all I am quite underwhelmed by the state of front-end web development in 2021.

On the one hand side I hope that rich-clients will gain favour again to avoid many of the problems I describe above; the problems you wouldn't have had
if you wouldn't have used a web application in the first place. Such a rich-client may actually come as a web-application in disguise like
[Electron](https://www.electronjs.org/). But things like [Java Web Start](https://en.wikipedia.org/wiki/Java_Web_Start) (by now removed from the JDK
but still living on as [OpenWebStart](https://openwebstart.com/)) and [JavaFX](https://en.wikipedia.org/wiki/JavaFX) deserve their place, too.

The other thing I would hope for is a reduction of the layers on top of layers of indirection. It seems that the people from the [Modern
Web](https://modern-web.dev/) project are thinking in a similar direction and are promoting [buildless approaches and
workflows](https://modern-web.dev/guides/). The same people are behind the [Open Web Components](https://open-wc.org/) sister project to promote
components that are independent of any framework. There exist several [base-libraries](https://open-wc.org/guides/community/base-libraries/) and some
[component-libraries](https://open-wc.org/guides/community/component-libraries/) that look at least on first sight promising.

I would hope for something simpler (less layers of abstraction) and something more stable with a longer life-cycle (longevity) to protect businesses
investments rather than needing to follow one short-lived hype after the other for no good reason.


## Related Content

* "Uncle" Bob Martin: [The Future of Programming](https://www.youtube.com/watch?v=ecIWPzGEbFc)
* Jonathan Blow: [Preventing the Collapse of Civilization](https://www.youtube.com/watch?v=pW-SOdj4Kkk)
* Bert Hubert: [How Tech Loses Out over at Companies, Countries and Continents](https://berthub.eu/articles/posts/how-tech-loses-out/)

## Footnotes

[^sourceforge]: keep in mind that [SourceForge](https://en.wikipedia.org/wiki/SourceForge) was only founded in 1999 and did not exist yet in 1997.
[^swc]: [SWC](https://blog.logrocket.com/why-you-should-use-swc/) seems to be the new kid on the block.

