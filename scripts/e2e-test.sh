#!/bin/bash

# Abort the mission if any command fails
set -e
set -x

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname $SCRIPTS)
TEMP=$(mktemp -d /tmp/react-native-XXXXXXXX)

# When tests run on CI server, we won't be able to see logs
# from packager because it runs in a separate window. This is
# a simple workaround, see packager/packager.sh
export REACT_PACKAGER_LOG="$TEMP/server.log"

# To make sure we actually installed the local version
# of react-native, we will create a temp file inside the template
# and check that it exists after `react-native init`
MARKER=$(mktemp $ROOT/local-cli/generator-ios/templates/app/XXXXXXXX)

function cleanup {
  EXIT_CODE=$?
  set +e

  if [ $EXIT_CODE -ne 0 ];
  then
    WATCHMAN_LOGS=/usr/local/Cellar/watchman/3.1/var/run/watchman/$USER.log
    [ -f $WATCHMAN_LOGS ] && cat $WATCHMAN_LOGS

    [ -f $REACT_PACKAGER_LOG ] && cat $REACT_PACKAGER_LOG
  fi

  rm $MARKER
  [ $SINOPIA_PID ] && kill -9 $SINOPIA_PID
  [ $SERVER_PID ] && kill -9 $SERVER_PID
  [ -f ~/.npmrc.bak ] && mv ~/.npmrc.bak ~/.npmrc
}
trap cleanup EXIT

cd $TEMP

# sinopia is npm registry proxy, it is used to make npm
# think react-native and react-native-cli are actually
# published on npm
# Temporarily installing sinopia from a github fork
# TODO t10060166 use npm repo when bug is fixed
which sinopia || npm install -g git://github.com/bestander/sinopia.git#057155985fe955ed6066d1fc2edc159c63dec675

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
cd EndToEndTest/ios

# Make sure we installed local version of react-native
ls EndToEndTest/`basename $MARKER` > /dev/null

flow --retries 10

../node_modules/react-native/packager/packager.sh --nonPersistent &
SERVER_PID=$!
xctool -scheme EndToEndTest -sdk iphonesimulator test
