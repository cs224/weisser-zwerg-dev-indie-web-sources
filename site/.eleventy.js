const moment = require('moment');

moment.locale('en');

module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy({ "./src/assets": "/" });

    eleventyConfig.addFilter('dateIso', date => {
        //return moment(date).toISOString();
        return moment(date).format("YYYY-MM-DD");
    });

    eleventyConfig.addFilter('dateReadable', date => {
        return moment(date).format('LL'); // E.g. May 31, 2019
    });

    eleventyConfig.addShortcode('excerpt', article => extractExcerpt(article));

    return {
        passthroughFileCopy: true,
        markdownTemplateEngine: "njk",
        templateFormats: ["html", "njk", "md"],
        dir: {
            input: "src",
            output: "dist",
            includes: "includes"
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
