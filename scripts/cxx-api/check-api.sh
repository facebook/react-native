#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e

ERR_CODE_UNCOMMITTED_API_CHANGE=1
ERR_CODE_CANT_FIND_PROJECT=2
ERR_CODE_BAD_COMMIT=3

# Delimit what we share with the users in PR / diffs
MSG_START="=== MSG_START ==="
MSG_END="=== MSG_END ==="

WARNING_MESSAGE_HEADER=$(cat <<EOF
# React Native Public C++ / Objective-C / Objective-C++ API Change Detected:

It looks like you've changed a public API that could affect our users, potentially breaking libraries and/or products using React Native.
EOF
)

WARNING_MESSAGE_TAIL=$(cat <<EOF

### What to do now?

Nothing for now, we're just tracking this. In the future we'll start adding folks from React Org as reviewers to check these changes align with our public API policy.

EOF
)

ERROR_MENTION_BREAKING_CHANGE=$(cat <<EOF

## Commit Message:

If you did not intend to change React Native's Public API, please revert those changes in this commit. If you did intend to change the Public API, You *MUST* add a changelog entry to your commit message using the "Breaking" type (https://reactnative.dev/contributing/changelogs-in-pull-requests). For example:

   ## Changelog:
   [General][Breaking] - Removed the Foo method to Bar as part of our deprecation mentioned in RFC-123

EOF
)

function check_if_mentions_breaking_change() {
    IN_COMMIT_MESSAGE=$(hg log -r . -T '{desc}' | grep -iE '\[(android|ios|general|internal)\]\s*\[breaking\]' || true)
    if [ -z "$IN_COMMIT_MESSAGE" ]; then
        echo "$ERROR_MENTION_BREAKING_CHANGE"
        echo "$MSG_END"
        exit $ERR_CODE_BAD_COMMIT
    fi
}

FBSOURCE_ROOT="$(hg root)"

# shellcheck source=xplat/js/env-utils/setup_env_base.sh
source "$FBSOURCE_ROOT/xplat/js/env-utils/setup_env_base.sh"

# Path to a version of clang and clang-format, these should be from a consistent version
CLANG_PATH=$( \
    buck2 build --console=none --show-output fbcode//third-party-buck/platform010/build/llvm-fb/19:bin/clang \
    | awk '{print $2}' \
    | xargs dirname \
)
export PATH="$FBSOURCE_ROOT/$CLANG_PATH:$PATH"

function cleanup() {
    # shellcheck disable=SC2317
    popd
}

pushd "$FBSOURCE_ROOT/xplat/js/react-native-github" || exit $ERR_CODE_CANT_FIND_PROJECT
trap cleanup EXIT

# TODO: This operates in the sandbox and can't modify files in the repository, which we need for change detection
# buck2 run //xplat/js/react-native-github/scripts/cxx-api:public-api
REPO_RELATIVE_DIR="scripts/cxx-api"
(cd "$REPO_RELATIVE_DIR" && $YARN_BINARY install)
$NODE_BINARY "$REPO_RELATIVE_DIR/public-api.js"
echo

API_FILE=$(grep -oP '(?<=output=)[^ \n]+' "$REPO_RELATIVE_DIR/public-api.conf")

API_STATUS=$(hg status --no-status "$API_FILE")
if [ -z "$API_STATUS" ]; then
    echo "🎉 No public API changes, happy days!"
    exit 0
else
    echo "$MSG_START"
    echo
    echo "$WARNING_MESSAGE_HEADER"
    echo
    echo "### Overview:"
    echo "\`\`\`"
    hg diff --stat
    echo "\`\`\`"
    echo "### Differences:"
    echo "\`\`\`diff"
    hg diff "$API_FILE"
    echo "\`\`\`"

    # Add any checks before showing the default warning
    check_if_mentions_breaking_change

    echo "$WARNING_MESSAGE_TAIL"
    echo "$MSG_END"
    exit $ERR_CODE_UNCOMMITTED_API_CHANGE
fi
