const path = require("path");

module.exports = function override(config, env) {
    config.resolve.alias = {
        ...config.resolve.alias,
        "@": path.resolve(__dirname, "src"),
        "@utils": path.resolve(__dirname, "src/utils"),
        "@service": path.resolve(__dirname, "src/services"),
        "@components": path.resolve(__dirname, "src/components"),
        "@screens": path.resolve(__dirname, "src/screens"), 
    };
    return config;
};
