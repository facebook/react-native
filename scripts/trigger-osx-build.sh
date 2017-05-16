#!/bin/bash
set -x

# circle-token hardcoded
curl \
  --header "Content-Type: application/json" \
  --data "{\"build_parameters\": {\"LINUX_SHA1\": \"$CIRCLE_SHA1\", \"PULL_ID\": \"$CIRCLE_PR_NUMBER\"}}" \
  --request POST \
  "https://circleci.com/api/v1/project/facebook/react-native-circle-ci-ios-build/tree/master?circle-token=5fed40b1cae9e97335ca59ea9abb57d0a34b5fd3"