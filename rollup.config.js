"use strict";

import babel from "rollup-plugin-babel";

export default {
    entry: "./index.js",
    dest: "./dist/index.js",
    format: "umd",
    moduleName: "sharedSessionStorage",
    sourceMap: true,
    plugins: [
        babel({
            presets: [
                [
                    "latest", {
                        es2015: false,
                    },
                ],
                "es2015-rollup",
            ],
        }),
    ],
};
