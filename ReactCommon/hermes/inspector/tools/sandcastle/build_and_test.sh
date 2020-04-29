#!/bin/bash
<<<<<<< HEAD
=======
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
>>>>>>> fb/0.62-stable

THIS_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source "$THIS_DIR/setup.sh"

<<<<<<< HEAD
buck test fbsource//xplat/hermes-inspector:chrome &&
  buck test fbsource//xplat/hermes-inspector:detail &&
  buck test fbsource//xplat/hermes-inspector:inspectorlib &&
  buck build fbsource//xplat/hermes-inspector:hermes-chrome-debug-server
=======
buck test fbsource//xplat/js/react-native-github/ReactCommon/hermes/inspector:chrome &&
  buck test fbsource//xplat/js/react-native-github/ReactCommon/hermes/inspector:detail &&
  buck test fbsource//xplat/js/react-native-github/ReactCommon/hermes/inspector:inspectorlib &&
  buck build fbsource//xplat/js/react-native-github/ReactCommon/hermes/inspector:hermes-chrome-debug-server
>>>>>>> fb/0.62-stable
