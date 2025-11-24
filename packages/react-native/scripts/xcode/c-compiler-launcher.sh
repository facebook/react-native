#!/bin/sh
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Get the absolute path of this script
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
CCACHE_BINARY="$(command -v ccache)"

# If ccache is available, use it with our config
if [ -n "$CCACHE_BINARY" ] && [ -x "$CCACHE_BINARY" ]; then
    REACT_NATIVE_CCACHE_CONFIGPATH=$SCRIPT_DIR/ccache.conf
    export CCACHE_CONFIGPATH="${CCACHE_CONFIGPATH:-$REACT_NATIVE_CCACHE_CONFIGPATH}"
    exec "$CCACHE_BINARY" "$@"
else
    # Fallback to direct execution
    exec "$@"
fi
