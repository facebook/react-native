#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

# shellcheck source=/dev/null
source "${THIS_DIR}/.packager.env"
cd "$THIS_DIR/.." || exit
<<<<<<< HEAD
node "./local-cli/cli.js" start "$@"
=======
node "./cli.js" start "$@"
>>>>>>> v0.59.0
