#!/bin/bash

set -e
set -x

# See https://app.flashlight.dev/projects/c172eb70-c96b-4d02-b865-1d1cdb80c519/test-list
PROJECT_ID="c172eb70-c96b-4d02-b865-1d1cdb80c519"

# Getting the nightly version name instead of the commit hash makes it easier to sort results in the dashboard by version
NIGHTLY_VERSION=$(node -e 'console.log(require("./scripts/npm-utils.js").getNpmInfo("nightly").version)')

MAESTRO_TEST_FOLDER="packages/rn-tester/js/components/perftesting"

curl https://get.flashlight.dev | bash
# For some reason path overriding doesn't work so we can't run `flashlight` directly
/home/runner/.flashlight/bin/flashlight cloud \
  --test "$MAESTRO_TEST_FOLDER/FlatListExample_start.yaml" \
  --beforeAll "$MAESTRO_TEST_FOLDER/FlatListExample_beforeAll.yaml" \
  --duration 10000 \
  --app app-hermes-armeabi-v7a-release.apk \
  --projectId "$PROJECT_ID" \
  --testName "FlatListExample_$ARCH" \
  --tagName "$NIGHTLY_VERSION"
