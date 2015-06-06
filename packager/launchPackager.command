#!/usr/bin/env bash

# Copyright (c) 2015-present, Facebook, Inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree. An additional grant
# of patent rights can be found in the PATENTS file in the same directory.


if [ -z "$1" ]; then
  echo "Missing argument: \$INFOPLIST_FILE"
  exit 0
fi

export INFOPLIST_FILE=$1

# extract RCTPackager/protocol from Info.plist
URL=$(/usr/libexec/PlistBuddy -c "Print :RCTPackager:url" "${INFOPLIST_FILE}" 2>/dev/null)
if [ -z "$URL" ]; then
  URL ="http://localhost"
fi

# extract RCTPackager/port from Info.plist
PORT=$(/usr/libexec/PlistBuddy -c "Print :RCTPackager:port" "${INFOPLIST_FILE}" 2>/dev/null)
if [ -z "$PORT" ]; then
  PORT="8081"
fi

export URL;
export PORT;

THIS_DIR=$(dirname "$0")

if nc -w 5 -z localhost $PORT ; then
  if ! curl -s "${URL}:${PORT}/status" | grep -q "packager-status:running" ; then
    echo "Port ${URL}:${PORT} already in use, packager is either not running or not running correctly"
    exit 2
  fi
else
  # open w/t --args doesn't work:
  # open $THIS_DIR/packager.sh --args --url=${URL} --port=${PORT} || echo "Can't start packager automatically"
  osascript -e 'tell app "Terminal"
    do script "'$THIS_DIR'/packager.sh --url='${URL}' --port='${PORT}'"
  end tell' || echo "Can't start packager automatically"
fi