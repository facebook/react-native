#!/bin/bash

# Set terminal title
echo -en "\033]0;React Packager\a"
clear

THIS_DIR=$(dirname "$0")
$THIS_DIR/packager.sh
echo "Process terminated. Press <enter> to close the window"
read
