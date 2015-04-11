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
}
trap cleanup EXIT

( cd $ROOT && npm link )
( cd $ROOT/react-native-cli && npm link )

npm install -g react-native-cli

cd $TEMP
react-native init EndToEndTest

cd EndToEndTest

# Make sure we installed local version of react-native
ls `basename $MARKER` > /dev/null
xctool -scheme EndToEndTest -sdk iphonesimulator8.1 test
