module.exports = function() {
    console.log(`node_env: ${process.env.NODE_ENV}`);
    return {
        eleventy_env: process.env.ELEVENTY_ENV,
            node_env:  process.env.NODE_ENV
    };
};
