#!/bin/sh

# Get the absolute path of this script
SCRIPT_DIR=$(dirname $(readlink -f "$0"))

REACT_NATIVE_CCACHE_CONFIGPATH=$SCRIPT_DIR/ccache.conf
# Provide our config file if none is already provided
export CCACHE_CONFIGPATH="${CCACHE_CONFIGPATH:-$REACT_NATIVE_CCACHE_CONFIGPATH}"

exec ccache clang "$@"
