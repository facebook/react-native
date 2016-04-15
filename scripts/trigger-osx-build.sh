#!/bin/bash
set -x

# circle-token hardcoded
# TODO safe?
curl \
  --header "Content-Type: application/json" \
  --data "{\"build_parameters\": {\"LINUX_SHA1\": \"$CIRCLE_SHA1\", \"PULL_ID\": \"$CIRCLE_PR_NUMBER\"}}" \
  --request POST \
  "https://circleci.com/api/v1/project/bestander/circle-ci-osx-test/tree/master?circle-token=655859fe09841c0b9b7029823d9c583d09816644"