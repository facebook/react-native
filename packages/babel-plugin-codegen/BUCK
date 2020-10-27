load("@fbsource//tools/build_defs/third_party:yarn_defs.bzl", "yarn_workspace")

yarn_workspace(
    name = "yarn-workspace",
    srcs = glob(
        ["**/*.js"],
        exclude = [
            "**/__fixtures__/**",
            "**/__flowtests__/**",
            "**/__mocks__/**",
            "**/__server_snapshot_tests__/**",
            "**/__tests__/**",
            "**/node_modules/**",
            "**/node_modules/.bin/**",
            "**/.*",
            "**/.*/**",
            "**/.*/.*",
            "**/*.xcodeproj/**",
            "**/*.xcworkspace/**",
        ],
    ),
    visibility = ["PUBLIC"],
)
