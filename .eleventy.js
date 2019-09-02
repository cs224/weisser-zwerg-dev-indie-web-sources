module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("./src/assets");

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