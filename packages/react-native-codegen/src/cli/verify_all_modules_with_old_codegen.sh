#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e
set -u

exec buck query "filter('generated_objcpp_modules_tests_', '//xplat/js/...')" | xargs buck build
