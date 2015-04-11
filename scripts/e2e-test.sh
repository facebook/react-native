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
  kill -9 $SINOPIA_PID
  mv ~/.npmrc.bak ~/.npmrc
  rm $MARKER
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

[ -d $SCRIPTS/.published-packages ] && rm -r $SCRIPTS/.published-packages
sinopia --config $SCRIPTS/e2e-sinopia.config.yml &
SINOPIA_PID=$!

npm publish $ROOT
npm publish $ROOT/react-native-cli

npm install -g react-native-cli
react-native init EndToEndTest
cd EndToEndTest

# Make sure we installed local version of react-native
ls `basename $MARKER` > /dev/null
xctool -scheme EndToEndTest -sdk iphonesimulator8.2 test
