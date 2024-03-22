# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This is a dummy CMake file that is just used to trigger the download of the right
# CMake version from the Android SDK. There is nothing to compile here.
project(cmakedownloader)
add_library(cmakedownloader SHARED cmakedownloader.cpp)
