#!/bin/bash

ulimit -n 4096

THIS_DIR=$(dirname "$0")
node $THIS_DIR/packager.js "$@"
