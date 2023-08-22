# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# Yoga by default does not enable optimizations in debug builds. Enable -O2
# for all builds in RN for faster debug app performance (at the cost of not
# being able to debug inside Yoga)
set(CMAKE_BUILD_TYPE Release)

add_subdirectory(yoga)
