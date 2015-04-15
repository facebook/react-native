#!/bin/bash

# Abort the mission if any command fails
set -e

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname $SCRIPTS)
TEMP=$(mktemp -d /tmp/react-native-XXXXXXXX)

# To make sure we actually installed the local version
# of react-native, we will create a temp file inside SampleApp
# and check that it exists after `react-native init`
MARKER=$(mktemp $ROOT/Examples/SampleApp/XXXXXXXX)

function cleanup {
  rm $MARKER
  [ $SINOPIA_PID ] && kill -9 $SINOPIA_PID
  [ -f ~/.npmrc.bak ] && mv ~/.npmrc.bak ~/.npmrc
}
trap cleanup EXIT

cd $TEMP

# sinopia is npm registry proxy, it is used to make npm
# think react-native and react-native-cli are actually
# published on npm
which sinopia || npm install -g sinopia

# but in order to make npm use sinopia we temporarily
# replace its config file
[ -f ~/.npmrc ] && cp ~/.npmrc ~/.npmrc.bak
cp $SCRIPTS/e2e-npmrc ~/.npmrc

sinopia --config $SCRIPTS/e2e-sinopia.config.yml &
SINOPIA_PID=$!

# Make sure to remove old version of react-native in
# case it was cached
npm unpublish react-native --force
npm unpublish react-native-cli --force
npm publish $ROOT
npm publish $ROOT/react-native-cli


npm install -g react-native-cli
react-native init EndToEndTest
cd EndToEndTest

# Make sure we installed local version of react-native
ls `basename $MARKER` > /dev/null

flow

xctool -scheme EndToEndTest -sdk iphonesimulator test
