const moment = require('moment');
const { DateTime } = require("luxon");

const filters = require('./_eleventy/filters.js')
const shortcodes = require('./_eleventy/shortcodes.js')

moment.locale('en');

const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')

const UpgradeHelper = require("@11ty/eleventy-upgrade-help");

module.exports = function(eleventyConfig) {
    // If you have other `addPlugin` calls, it’s important that UpgradeHelper is added last.
    // eleventyConfig.addPlugin(UpgradeHelper);
    eleventyConfig.amendLibrary("md", mdLib => mdLib.enable("code"));

    eleventyConfig.addPlugin(pluginRss);
    eleventyConfig.addPlugin(pluginSyntaxHighlight);

    // https://github.com/JordanShurmer/eleventy-plugin-toc
    const pluginTOC = require('eleventy-plugin-nesting-toc');
    eleventyConfig.addPlugin(pluginTOC);

    eleventyConfig.addPassthroughCopy({ "./src/assets": "/" });

    eleventyConfig.addFilter('dateIso', date => {
        //return moment(date).toISOString();
        return moment(date).format("YYYY-MM-DD");
    });

    eleventyConfig.addFilter('dateReadable', date => {
        return moment(date).format('LL'); // E.g. May 31, 2019
    });

    eleventyConfig.addFilter('htmlDateString', (dateObj) => {
        return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
    });

    eleventyConfig.addFilter('url_encode', parameter => {
        return encodeURI(parameter);
    });

    eleventyConfig.addFilter('urlToSlug', inputUrl => {
        const pathElements = inputUrl.trim().split('/');
        let lastElement = null;
        for(const pe of pathElements) {
            if(pe.trim() != '')
                lastElement = pe.trim();
        }
        if(lastElement.includes('.')) {
            const elements = lastElement.splice('.');
            lastElement = elements[0];
        }
        return lastElement;
    });

    eleventyConfig.addNunjucksFilter("rssLastUpdatedRfc822Date", collection => {
        if( !collection || !collection.length ) {
            throw new Error( "Collection is empty in rssLastUpdatedDate filter." );
        }

        // Newest date in the collection
        return dateToRfc822(collection[ collection.length - 1 ].date);
    });

    eleventyConfig.addNunjucksFilter("rssRfc822Date", dateObj => dateToRfc822(dateObj));


    // Filters
    Object.keys(filters).forEach(filterName => {
        console.log(filterName);
        eleventyConfig.addFilter(filterName, filters[filterName])
    })

    eleventyConfig.addShortcode('excerpt', article => extractExcerpt(article));

    // Shortcodes
    Object.keys(shortcodes).forEach(shortCodeName => {
        eleventyConfig.addShortcode(shortCodeName, shortcodes[shortCodeName])
    })

    // https://www.11ty.io/docs/collections/
    eleventyConfig.addCollection("myCollectionsReverse", function(collection) {
        return collection.getAllSorted().reverse();
    });


    let markdownIt = require("markdown-it");
    let markdownItEmoji = require("markdown-it-emoji");
    let markdownItFootnote = require('markdown-it-footnote');
    let markdownItAnchor = require('markdown-it-anchor');
    let markdownItKatex = require("markdown-it-katex");
    let markdownItInclude = require('markdown-it-include');
    let options = {
        html: true,
        breaks: false,
        linkify: true,
        typographer: true
    };



    const link_icon = '<svg class="octicon octicon-link" style="vertical-align: middle;" role="img" aria-hidden="true" width="16" height="16"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/icons.svg#octicon-link"></use></svg>'

    let markdownLib = markdownIt(options).use(markdownItInclude, '../../blog-series-monte-carlo-methods').use(markdownItEmoji).use(markdownItFootnote).use(markdownItAnchor, {permalink: true, permalinkSymbol: link_icon, permalinkBefore: true}).use(markdownItKatex, {"throwOnError" : false, "errorColor" : " #cc0000"});

    eleventyConfig.setLibrary("md", markdownLib);

    return {
        passthroughFileCopy: true,
        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk",
        templateFormats: ["html", "njk", "md"],
        dir: {
            input: "src",
            output: "dist",
            includes: "includes",
            data: "data"
        }
    };
};

function extractExcerpt(article) {
    if (!article.hasOwnProperty('templateContent')) {
        console.warn('Failed to extract excerpt: Document has no property "templateContent".');
        return null;
    }

    let excerpt = null;
    const content = article.templateContent;

    // The start and end separators to try and match to extract the excerpt
    const separatorsList = [
        { start: '<!-- Excerpt Start -->', end: '<!-- Excerpt End -->' },
        { start: '<p>', end: '</p>' }
    ];

    separatorsList.some(separators => {
        const startPosition = content.indexOf(separators.start);
        const endPosition = content.lastIndexOf(separators.end);

        if (startPosition !== -1 && endPosition !== -1) {
            excerpt = content.substring(startPosition + separators.start.length, endPosition).trim();
            return true; // Exit out of array loop on first match
        }
    });

    return excerpt;
};

const anchoredHeaderRenderFn = (slug, opts, state, idx) => {
    const space = () => Object.assign(new state.Token('text', '', 0), { content: ' ' })

    const linkTokens = [
        Object.assign(new state.Token('link_open', 'a', 1), {
            attrs: [
                ['class', opts.permalinkClass],
                ['href', opts.permalinkHref(slug, state)],
                ['aria-hidden', 'true']
            ]
        }),
        Object.assign(new state.Token('html_block', '', 0), { content: opts.permalinkSymbol }),
        new state.Token('link_close', 'a', -1)
    ]

    // `push` or `unshift` according to position option.
    // Space is at the opposite side.
    if (opts.permalinkSpace) {
        linkTokens[position[!opts.permalinkBefore]](space())
    }
    state.tokens[idx + 1].children[position[opts.permalinkBefore]](...linkTokens)
}

function dateToRfc822(d) {
    const rfc822Date = moment(d).format('ddd, DD MMM YYYY HH:mm:ss ZZ');
    return rfc822Date;
}
