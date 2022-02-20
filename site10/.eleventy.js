const moment = require('moment');
const { DateTime } = require("luxon");

const filters = require('./_eleventy/filters.js')
const shortcodes = require('./_eleventy/shortcodes.js')

moment.locale('en');

const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function(eleventyConfig) {
    eleventyConfig.addPlugin(pluginRss);

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
