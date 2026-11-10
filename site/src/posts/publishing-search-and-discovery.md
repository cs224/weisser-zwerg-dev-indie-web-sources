---
layout: "layouts/post-with-toc.njk"
title: "Search and Discovery: Search Engines, Independent Indexes, and Decentralization"
description: "Understanding how people find what we publish"
seodescription: "An introduction to web search and discovery: conventional search engines, independent indexes, decentralized approaches, and the lessons of Presearch."
creationdate: 2026-11-11
keywords: search engines, independent publishing, web discovery, decentralized search, independent indexes, Presearch, web crawling, search privacy, IndieWeb
date: 2026-11-11
tags: ['post']
---

## Rationale

From time to time, I used the search engine [Presearch](https://www.presearch.com).
Recently, I noticed that it was no longer available and found the announcement [Presearch is Shutting Down](https://presearch.beehiiv.com/p/presearch-is-shutting-down), published on July 24, 2026.

The announcement prompted me to look more closely at what had happened.
In doing so, I was surprised to learn how Presearch had been built: it combined a conventional web search interface with decentralized computing infrastructure and a cryptocurrency-based incentive system.

Community-operated servers processed searches, and their operators received rewards through the **PRE** token.
Blockchain technology supported the token, staking, and economic incentives; the search engine itself ran on those servers.
The [Presearch documentation](https://docs.presearch.io/) still describes this arrangement, including its intended [tokenomics](https://docs.presearch.io/presearch-project/tokenomics).

Presearch also developed its own search index, [Indee](https://docs.presearch.io/presearch-engine/presearch-indee), alongside its use of external search providers.
In a [July 2026 update](https://presearch.beehiiv.com/p/series-iv-node-auction), the team explained that it had temporarily taken the index offline to develop AI-based filtering of low-quality content and was preparing a transition to GPU-powered search nodes.
The project was still announcing changes to its infrastructure shortly before the shutdown.

Learning about this architecture raised a further question: **why hadn't decentralization prevented the shutdown?**

The project had distributed some of its computing work, but the overall service still depended on the company operating it.
Running a search node did not give an operator everything needed to continue the platform independently, including its gateways, account management, and node coordination.
In its shutdown announcement, Presearch reported that the cost of maintaining its infrastructure exceeded what the business could sustain at its level of search traffic and advertising revenue.
A [subsequent update](https://presearch.beehiiv.com/p/presearch-is-shutting-down-update) confirmed that third-party providers had already begun disconnecting parts of the backend infrastructure.

Some of Presearch's code remains available through the [PresearchOfficial GitHub organization](https://github.com/PresearchOfficial), and the PRE token can exist on its underlying blockchains independently of the company.
Neither is sufficient to keep the complete search platform running.

The distinction matters because several different goals are involved:

* **Distributed computing:** search queries are processed across independently operated machines.
* **Privacy:** operators and external search providers receive less information about individual users.
* **Censorship resistance:** no single party can determine what the entire search network is allowed to find or make available.
* **Continuity:** others can keep the service operating if its original operator withdraws.

Presearch combined distributed computing with privacy goals, but its shutdown exposed the remaining central dependencies.
Calling a search engine *decentralized* tells us little unless we also understand which parts are distributed and who controls the parts that remain.

This is what led me to take a closer look at search and discovery.
My earlier articles on [Nostr](../publishing-nostr-basics/), [Hive](../publishing-hive-basics/), and [Arweave and AR.IO](../publishing-arweave-ario-basics/) explored ways to publish, distribute, and preserve our work.
Readers also need ways to find it.
In this blog post, I want to understand how conventional search engines, independent indexes, and decentralized approaches meet that need, and what their different dependencies mean for independently published content.

## Conventional Search: Google, Bing, and Brave

[Google](https://www.google.com/), Microsoft's [Bing](https://www.bing.com/), and [Brave Search](https://search.brave.com/) each maintain their own search index.
Their crawlers discover and fetch web pages, their indexing systems organize the information, and their ranking systems select results for a query.

> Brave's [independent index](https://search.brave.com/help/independence) provides an alternative to Google and Bing, while remaining a service operated by one company.

For a publisher, the practical starting points are:

1. **Make pages accessible and linked.** Publish at stable public URLs, with readable HTML, descriptive titles, and ordinary links from your homepage, navigation, or article listings. A crawler should be able to reach the content without logging in.
2. **Allow crawling and indexing.** Check that your site's `robots.txt` permits the relevant crawlers and that pages intended for search do not carry a `noindex` directive. These control different things: `robots.txt` governs crawling; `noindex` asks an engine to exclude a page from results.
3. **Provide an XML sitemap.** This lists the page URLs you want search engines to discover, optionally with accurate modification dates. My site's [sitemap.xml](https://weisser-zwerg.dev/sitemap.xml) is a concrete example. Have your publishing system keep it up to date and advertise its location in `robots.txt`, for example:

   ```text
   Sitemap: https://example.org/sitemap.xml
   ```

4. **Use the webmaster tools for submission and diagnostics.** Verify ownership in [Google Search Console](https://search.google.com/search-console/about) and [Bing Webmaster Tools](https://www.bing.com/webmasters/), submit your sitemap, and inspect reported indexing problems. These accounts are optional; crawlers also discover sites through links. Bing additionally supports [IndexNow](https://www.bing.com/indexnow) notifications when pages change.

For Brave, follow its [crawler guidance](https://search.brave.com/help/brave-search-crawler): pages blocked from Googlebot will also be skipped by Brave's crawler.

Google's [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), its [sitemap instructions](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), and Bing's [sitemap guide](https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed) explain the details.
These steps help engines find and process a site; they do not guarantee inclusion or a particular ranking.
The publisher controls what is available, while each search operator decides what appears in its results.

## What Can Be Decentralized?

The alternatives become easier to understand when we separate four properties:

* **An independent index** gives us another selection of web pages and another way of ranking them, without relying on Google or Bing for those results.
* **Open-source software** lets others inspect, modify, and operate the search engine. Continuing an existing service also requires its data, computing resources, and operational knowledge.
* **Community participation** lets people contribute pages, computing capacity, or judgments about relevance. The resulting index may still be operated centrally.
* **A distributed index** places search data across independently operated machines. Its usefulness then depends on how those machines cooperate, remain reachable, and handle missing or unreliable peers.

These properties can occur in different combinations.
Several independently operated search engines can make discovery less dependent on a few companies, even when each engine is centrally run.
A peer-to-peer system distributes responsibility within the search engine itself.

[SearXNG](https://docs.searxng.org/user/about.html) belongs to a related category: **metasearch**.
It queries other search services and combines their results, with privacy protections, configurable sources, and the option to run your own instance.
Those are useful capabilities, but SearXNG does not build its own web index.
It can provide access to independent engines as well as large commercial ones; the underlying coverage still comes from the selected sources.
For this article, I will concentrate on projects that build indexes or provide infrastructure for doing so.

## Mojeek: An Independent Search Provider

[Mojeek](https://www.mojeek.com/) is a straightforward example of independence at the provider level.
It operates its own crawler, **MojeekBot**, builds its own web index, and applies its own ranking algorithms.

For readers, that offers another view of the web.
For publishers, it creates another opportunity to be found without having every discovery route depend on the same underlying index.

The service remains operated by one company, though.
Mojeek has [explained its decision to keep its search technology proprietary](https://blog.mojeek.com/2022/07/frequently-asked-questions-about-mojeek-open-source-tor-and-crawling.html), so using it does not give us the ability to take over its software and index if the operator disappears.
Its contribution here is a separate provider making its own choices about coverage and ranking.

**For publishers:** allow [MojeekBot](https://www.mojeek.com/bot.html) to access your public pages and make them reachable through ordinary links.
Mojeek's [submission guidance](https://blog.mojeek.com/2015/03/how-to-submit-your-site-to-mojeek.html) says it discovers sites through crawling and does not provide a general manual submission service.
Links from other relevant websites therefore matter; submitting a sitemap to Mojeek is not possible.

## Marginalia: Discovering Independent Websites

[Marginalia Search](https://marginalia-search.com/) approaches independence with a more particular idea of what deserves attention.
It prioritizes noncommercial material and offers tools for exploring websites, including older pages that can be difficult to encounter through mainstream search.
Its [stated purpose](https://about.marginalia-search.com/) is to complement larger engines and help people discover the independent web.

This makes it especially relevant to personal publishing.
An engine that deliberately pays attention to personal sites can be useful even with a narrower collection of pages.

Marginalia publishes its crawler and index software under the AGPL license.
The public service and its index are operated centrally, principally by its developer Viktor Lofgren.
The available code gives others a basis for operating an engine, while maintaining an index still takes storage, crawling, funding, and work.

**For publishers:** the [submission instructions](https://github.com/MarginaliaSearch/submit-site-to-marginalia-search) offer several routes, including a GitHub issue containing your site's URL or a pull request adding it to the crawl list.
The instructions also describe an email route and an interface for sites already known to the engine.
Inclusion can take a crawl cycle, which may mean a month or more.
Check the [crawler guidance](https://about.marginalia-search.com/article/crawler/) as well: a submission cannot help if your server blocks the crawler.

For a concrete example, I submitted [this pull request to add weisser-zwerg.dev](https://github.com/MarginaliaSearch/submit-site-to-marginalia-search/pull/834).
It adds the bare domain `weisser-zwerg.dev` to `sites.txt`, inside the existing list as requested by the contribution instructions.
Submitting the request is the first step; acceptance and crawling happen separately.

### Wiby: A Deliberately Smaller Web

[Wiby](https://www.wiby.org/about/) is a useful companion to Marginalia.
It focuses on simpler pages and the personal, exploratory character of the earlier web.
Its [software is available under the GPL](https://www.wiby.me/about/guide.html), allowing others to operate their own search engine around a subject or community.

**For publishers:** Wiby's [submission form](https://www.wiby.org/submit/) accepts individual pages and explains its selection criteria.
Simple, noncommercial HTML is preferred, and in most cases only the submitted page is crawled.

## Mwmbl: Community Crawling and Curation

[Mwmbl](https://mwmbl.org/), pronounced "mumble," combines an open-source search engine with a nonprofit purpose and community participation.
Volunteers help crawl the web and curate results.
The project's [README](https://github.com/mwmbl/mwmbl) states: **the crawling is distributed, while the index is centralized**.

That distributes some of the expense and effort of building a search engine.
It also gives participants a role beyond supplying machines: the community helps decide which results are useful.
The [Mwmbl book](https://book.mwmbl.org/) describes the values behind that process and the possibility of excluding sites by community consensus.

Building an independent index also means living with gaps in its coverage.
Mwmbl's index is much smaller than those of large commercial engines, so it can miss pages people need.
Its optional [Seed Search](https://mwmbl.org/seed-search) feature addresses this by using people's searches to find useful pages and grow the index.

With Seed Search enabled, Mwmbl searches its own index and requests additional results from [European Search Perspective (EUSP)](https://www.eu-searchperspective.com/), a joint venture of Ecosia and Qwant that builds a European web index.
It combines those results, applies its own ranking, and uses **Jev**, a model from [TypeSafe AI](https://typesafe.ai/), to assess relevance and quality for the final ordering.

The "seed" is what remains after that search: newly discovered results are also added to Mwmbl's index under the query's terms.
They can then appear in later searches, including searches with Seed Search switched off.
This helps improve today's results while expanding Mwmbl's own coverage.
Using the feature sends query text to the external providers; if they are unavailable, Mwmbl falls back to its own index or ranking as needed.

**For publishers:** Mwmbl provides a [domain-submission page](https://mwmbl.org/domain-submissions) for suggesting sites to crawl.

Those interested in contributing infrastructure can follow the [volunteer crawler guide](https://book.mwmbl.org/page/community/), which uses a Mwmbl account and API key.

Running that crawler supports the project's index.
The open code improves the possibilities for continuation, but an independent replacement would still need data, hosting, and people to operate it.

## YaCy: Sharing the Index Across Peers

[YaCy](https://yacy.net/) changes the role of the participant more fundamentally.
Its free software can run a crawler, maintain an index, and answer searches on a machine you operate.
In peer-to-peer mode, that machine also participates in a network of other search peers.

The shared material is an index connecting search terms to web pages.
YaCy distributes these references using a **distributed hash table**, which determines which peers hold particular parts of the index.
A search can then ask relevant peers for results.
Each peer holds only part of the shared index, with redundancy across peers; installing YaCy does not download one complete catalogue of the web.
The [YaCy FAQ](https://yacy.net/faq/) explains these relationships.

There are two useful ways to operate it:

* **An independent search portal:** crawl your own site or a chosen collection of websites and serve searches over that collection.
* **A participant in the public network:** contribute index entries and query other peers, extending discovery beyond your own collection.

This is a significant difference from contributing a crawler to a centrally operated service.
Your machine also provides search functionality, and the network does not require one company's query service to remain available.
New peers still need to find existing peers, but YaCy's [network documentation](https://yacy.net/operation/network-definition/) explains how multiple participants can publish the seed lists used for that initial contact.

**For publishers:** a practical starting point is to run a peer and use its [crawl controls](https://yacy.net/operation/crawlstart_p/) to start a crawl limited to your own public website.
Check that its pages appear in your local index, then decide whether to keep that index isolated or enable participation in the public network.
The [download page](https://yacy.net/download_installation/) and FAQ provide the installation and operating guidance.

The tradeoff is operational responsibility.
Someone must supply disk space, bandwidth, and processing time, maintain the software, and keep enough peers reachable.
Coverage depends on what participants crawl, freshness depends on recrawling, and search performance depends partly on the available peers.

Of these examples, YaCy most directly addresses the question raised by Presearch: participants can operate the search machinery themselves and cooperate without one mandatory central search provider.
That is a useful architectural property, even though it does not by itself establish the network's quality or completeness as an everyday search engine.

## Shared Infrastructure and Permaweb Search

Two further projects extend the comparison beyond individual public search services.

### OpenWebSearch and the Open Web Index

[OpenWebSearch.eu's Open Web Index](https://openwebsearch.eu/open-webindex/) explores providing index data as shared infrastructure from which others can build search applications.
Its [federated pilot](https://openwebsearch.eu/the-project/status/) distributes work across participating institutions and makes index partitions available for reuse.
This could allow several applications to apply different ranking and presentation choices without each having to repeat the entire crawling effort.

The current offering is a pilot with access under a research licence.
Its usefulness depends on the participating institutions, continued operation, and the terms under which others can obtain the data.

### Wuzzy: Search Around Arweave and AO

[Wuzzy](https://wuzzy.arweave.net/) connects this topic to the earlier [Arweave article](../publishing-arweave-ario-basics/).
Its [documentation](https://docs_wuzzy.arweave.net/) describes crawlers and search indexes built on [AO](../publishing-arweave-ario-basics/#from-arweave-to-ar.io-and-ao), with support for ordinary web URLs, Arweave transaction URLs, and ArNS names.
The public interface identifies itself as an alpha release.

The [quickstart](https://docs_wuzzy.arweave.net/guide/index.html) describes deploying a **Nest**, which holds an index, and crawlers that send documents to it.
It also documents access controls: an owner grants permissions, and authorized actors can remove documents from that index.

> AO supplies the execution infrastructure, while each Nest still has its own collection and permissions.
> Permanent storage of an article does not compel any particular Nest to include it in search results.

For a publisher who wants to experiment, the documented route is to operate a Nest and crawler, or work with an existing operator willing to index the publication.
This is an experimental option for discovery around the permaweb, with dependencies on the chosen AO infrastructure, gateways, index, and search interface.

## Comparing the Dependencies

The following comparison concerns architecture and participation, rather than ranking the quality of search results.

<style>
  table.article-table {
    border-collapse: collapse;
    margin: 1em 0;
    width: 100%;
    max-width: 100%;
    font-family: Arial, sans-serif;
  }
  .article-table th, .article-table td {
    border: 1px solid #ccc;
    padding: 0.6em;
    text-align: left;
    vertical-align: top;
    overflow-wrap: anywhere;
  }
  .article-table th {
    background-color: #f2f2f2;
    font-weight: bold;
  }
  .article-table code {
    white-space: normal;
  }
</style>

<table class="article-table">
  <thead>
    <tr>
      <th scope="col">Project</th>
      <th scope="col">Index and operational control</th>
      <th scope="col">Code, data, and participation</th>
      <th scope="col">Publisher's route</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Mojeek</td>
      <td>Own index; centrally operated by the company</td>
      <td>Proprietary search technology; public search service</td>
      <td>Keep pages crawlable and discoverable through links</td>
    </tr>
    <tr>
      <td>Marginalia</td>
      <td>Own index; independently operated public service</td>
      <td>Open-source engine; site suggestions and contributions</td>
      <td>Use the documented crawl-submission routes</td>
    </tr>
    <tr>
      <td>Wiby</td>
      <td>Selective index controlled by each installation's operators</td>
      <td>Free software for running a separate engine</td>
      <td>Submit suitable individual pages</td>
    </tr>
    <tr>
      <td>Mwmbl</td>
      <td>Central index with volunteer crawling and community curation; optional external Seed Search providers</td>
      <td>Open-source engine; contribute crawling, code, or curation</td>
      <td>Submit a domain; follow the separate curation rules</td>
    </tr>
    <tr>
      <td>YaCy</td>
      <td>Index references distributed among peers, or an isolated local index</td>
      <td>Free software; operate a crawler, index, and search peer</td>
      <td>Crawl your site and choose whether to share with peers</td>
    </tr>
    <tr>
      <td>Open Web Index</td>
      <td>Federated institutional infrastructure</td>
      <td>Index partitions offered under research terms</td>
      <td>Relevant mainly to building search applications</td>
    </tr>
    <tr>
      <td>Wuzzy</td>
      <td>AO processes; each Nest controls its index and permissions</td>
      <td>Code and deployment guide; operate a Nest and crawlers</td>
      <td>Experiment with a chosen index operator or your own deployment</td>
    </tr>
  </tbody>
</table>

The distinction between code and data matters throughout this comparison.
A software licence can let someone continue development, but reconstructing a useful web index may still be expensive.
A shared index reduces dependence on one operator only to the extent that other participants can actually retain, update, and serve the relevant data.

## Conclusion

For independently published articles, it helps to have several routes to discovery.
An independent search engine may surface material that a larger one overlooks.

Search engines are among the main gateways to the web.
Ideally, they would index it as comprehensively as possible and rank results according to what people are looking for, without censoring content or allowing commercial interests to determine what comes first.
A distributed approach, such as the one [YaCy](https://yacy.net/) is pursuing, may be particularly well suited to that goal.

How these projects develop is worth watching.

## Appendix: Older Ways to Find and Follow Websites

My interest in discovery goes back to the earlier design of this website.
Even then, the idea was to separate publishing an article from the ways people found, followed, and discussed it.
Directories, feeds, and links between independently operated websites were already part of that thinking.

Some of the approaches below come from the early web; others, such as Webmention and ActivityPub, are later developments.
They do not all predate search engines, but they offer ways to reach readers without making a search engine the only point of entry.

### Human-Edited Directories

A web directory organizes websites into categories, with people selecting and describing the entries.
Readers can browse a subject and follow links to sites they might never have thought to search for by name.
For a publisher, the usual route is to suggest a site to a suitable category and let its editors decide whether it belongs.

[Curlie](https://curlie.org/) remains an example of this approach.
It [continues the work of the Open Directory Project and DMOZ](https://curlie.org/docs/en/about.html), using volunteer editors to maintain its categories and listings.
Its value comes from that selection; it does not aim to include every page on the web.

### Webrings

A webring connects participating websites through links that take the visitor to another member, often labelled **previous**, **next**, or **random**.
It invites exploration: a reader visiting one personal website can continue to others in the same community.

[An IndieWeb Webring](https://xn--sr8hvo.ws/) is still operating and maintains a [directory of participating sites](https://xn--sr8hvo.ws/directory).
My site is listed there, and the arrows in this website's footer are its previous and next links.
They are a small, working example of discovery through neighbouring websites.

### Blogrolls and Personal Recommendations

A **blogroll** is a list of websites that an author reads or recommends.
A reader who finds one author's work interesting can follow those recommendations to discover other people.
An ordinary page of links is enough to implement it.

The [IndieWeb's blogroll page](https://indieweb.org/blogroll) collects examples and explains the practice.
[Ye Olde Blogroll](https://blogroll.org/) applies the same idea on a larger scale, maintaining a curated collection of personal and independent blogs.

Links within articles serve a related purpose: they connect a particular argument or explanation to someone else's work.
The source links throughout my articles give readers those paths directly.
Each author makes a small set of recommendations, and readers can follow the connections between them.

### Feeds, Feed Directories, and Email Subscriptions

**RSS and Atom feeds** let readers subscribe to a publication and receive its new entries in a feed reader.
Once someone has found a website, they can keep following it without needing to find each new article through search.
[FreshRSS](https://freshrss.org/) is a current example of a reader that people can host themselves.

My website publishes an [RSS feed](https://weisser-zwerg.dev/feed/feed.xml), linked from the footer.
It lists new articles with descriptions and links back to the full text.

A feed directory adds the initial discovery step.
[follow.it's directory](https://follow.it/feeds) lets readers find feeds and choose which publications to follow; the service also offers delivery by email.
This was the purpose of my earlier **SpecificFeeds** integration.
SpecificFeeds [relaunched as follow.it](https://blog.follow.it/follow-it-launches/), and my old link now leads to the [weisser-zwerg feed page](https://follow.it/weisserdzwerg).
The newsletter form on my homepage still comes from that original integration.

The distinction is useful: my feed is available at an address I control, while follow.it provides an additional directory and delivery service around it.
Readers can also subscribe to the feed directly in their preferred reader.

### Webmentions: Discovery Through References and Replies

[Webmention](https://www.w3.org/TR/webmention/) lets one website notify another that it has linked to it.
If I write a response to someone else's article on my own site, their site can verify the link and display my response alongside the original.
Readers can then follow the conversation between the two publications.
The receiving site decides what to display; sending a mention does not guarantee a visible backlink.

This was part of my original idea for making articles known: a reference to another person's work could also make my contribution discoverable from their page.
My [Webmention Test](../webmention-test/) from September 2019 records an early experiment.
The site uses [webmention.io](https://webmention.io/) to receive mentions, which its templates can display beneath articles.

Webmention provides a common protocol between separately operated sites.
Using a hosted receiver makes it convenient, while adding a dependency on that service.

### POSSE: Publish Here, Share Elsewhere

[POSSE](https://indieweb.org/POSSE) means **Publish on your Own Site, Syndicate Elsewhere**.
The original article lives on the author's website; copies, excerpts, or announcements elsewhere help it reach people who already read those services.
A link back gives those readers a route to the original publication.

My 2019 [article about running Discourse locally](../local-discourse-on-vagrant/) is an example: I also shared it as a [syndicated copy on Medium](https://medium.com/@weisser.zverg/local-discourse-vagrant-ansible-lxd-docker-discourse-embedding-6da1065e175f).
Sharing a short announcement with a link on Mastodon follows the same principle without requiring a complete copy.

### ActivityPub and Mastodon: Discovery Through Social Connections

[Mastodon](https://joinmastodon.org/) offers discovery through the people a reader follows, their replies, and the posts they share.
Its use of **ActivityPub** allows those relationships and interactions to extend across participating servers.
An article can reach a new reader because someone they follow has drawn attention to it.

[Bridgy Fed](https://fed.brid.gy/) connects ordinary websites with the fediverse and other supported networks.
Its [current documentation](https://fed.brid.gy/docs) explains how website posts and interactions can cross those boundaries.

I explored this in my September 2019 post [ActivityPub integration via fed.brid.gy](../activity-pub-integration-via-fed-brid-gy2/), which links a response on my own site to a Mastodon post.

### Shared Annotations and Conversations Around a Page

Another idea I considered was a browser extension that would place a discussion layer over an existing website.
Readers could comment on an article even if its publisher had not installed a comment system.

[Hypothesis](https://web.hypothes.is/web-app-start/) provides this through a browser extension or bookmarklet, with annotations that can be public, private, or shared within a group.
Its [annotation search](https://web.hypothes.is/help/how-hypothesis-search-works/) lets readers explore public contributions by user, tag, URL, or text.
That creates a further discovery route: finding an article through what other people have said about it.
