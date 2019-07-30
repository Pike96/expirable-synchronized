module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                "targets": {
                    "esmodules": true
                },
            },
        ],
    ],
    plugins: [
        ["@babel/plugin-proposal-decorators", { "legacy": true }],
        "@babel/plugin-proposal-object-rest-spread",
        "@babel/plugin-proposal-export-default-from",
        "@babel/plugin-proposal-export-namespace-from",
        "@babel/plugin-proposal-class-properties",
    ],
};