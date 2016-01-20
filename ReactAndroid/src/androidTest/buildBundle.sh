#!/bin/bash

# TODO put output to temp folder?
node ./local-cli/cli.js bundle --entry-file ReactAndroid/src/androidTest/assets/TestBundle.js --dev --platform android --bundle-output ReactAndroid/src/androidTest/assets/ReactAndroidTestBundle.js
