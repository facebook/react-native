#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Set terminal title
echo -en "\\033]0;Metro Bundler\\a"
clear

THIS_DIR=$(dirname "$0")
. "$THIS_DIR/logging.sh"
beginLog

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
<<<<<<< HEAD
. "$THIS_DIR/packager.sh" 2>&1 | tee -a "${LOG_FILE}"

endLog

if [ "$SERVERS_NO_WAIT" != "1" ]; then
  echo "Process terminated. Press <enter> to close the window"
  read
fi
=======

# shellcheck source=/dev/null
. "$THIS_DIR/packager.sh"

echo "Process terminated. Press <enter> to close the window"
read -r
>>>>>>> v0.58.6
