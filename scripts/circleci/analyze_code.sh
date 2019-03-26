#!/bin/bash

cat <(echo eslint; yarn --silent lint --format=json; echo flow; yarn --silent flow check --json) | GITHUB_TOKEN=$GITHUB_TOKEN CI_USER=$CI_USER CI_REPO=$CI_REPO PULL_REQUEST_NUMBER=$PULL_REQUEST_NUMBER node bots/code-analysis-bot.js

# check status
STATUS=$?
if [ $STATUS == 0 ]; then
  echo "Code analyzed successfully"
else
  echo "Code analyzis failed, error status $STATUS"
fi

