#!/bin/bash

set -e

# Make sure we don't accidentally restore a cache that contains the Metro
# filename issue that was fixed in Metro 0.25, originally introduced in
# D6752278. Once fixed, this was causing sporadic failures in the iOS
# and tvOS workflows as the issue persisted in the cached node_modules
#
# The filename issue can be summarized as follows:
# A version of Metro was published to npm with HmrClient.js and
# HmrClient.js.flow files, while the repo contains HMRClient.js and
# HMRClient.js.flow. This was due to a case issue in the publisher's
# host machine.
# The issue this is checking for is manifested by the presence of all
# of the following files: HmrClient.js, HMRClient.js, HmrClient.js.flow,
# HMRClient.js.flow.

EXPECTED='1'
ACTUAL=$(ls node_modules/metro/src/lib/bundle-modules/*.js | xargs | awk '{print tolower($0)}' | tr ' ' '\n' | grep hmrclient.js | wc -l | tr -d '[:space:]')

if [ "$EXPECTED" != "$ACTUAL" ]; then
  echo "HmrClient.js crept into the cache?"
  echo $(ls node_modules/metro/src/lib/bundle-modules/H*lient.js)
  exit 1
fi
