const { register } = require("tsconfig-paths");

register({
    baseUrl: require("path").join(__dirname, "dist"),
    paths: {
        "@auth/*": ["auth/*"],
        "@config/*": ["config/*"],
        "@controllers/*": ["controllers/*"],
        "@database/*": ["database/*"],
        "@decorators/*": ["decorators/*"],
        "@di/*": ["di/*"],
        "@dto/*": ["dto/*"],
        "@entities/*": ["entities/*"],
        "@events/*": ["events/*"],
        "@http/*": ["http/*"],
        "@exceptions/*": ["exceptions/*"],
        "@lang/*": ["lang/*"],
        "@middlewares/*": ["middlewares/*"],
        "@repositories/*": ["repositories/*"],
        "@schedule/*": ["schedule/*"],
        "@services/*": ["services/*"],
        "@validation/*": ["validation/*"]
    }
});
