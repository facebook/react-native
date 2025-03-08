# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

add_library(double-conversion
        STATIC
        double-conversion/bignum.cc
        double-conversion/bignum-dtoa.cc
        double-conversion/cached-powers.cc
        double-conversion/diy-fp.cc
        double-conversion/double-conversion.cc
        double-conversion/fast-dtoa.cc
        double-conversion/fixed-dtoa.cc
        double-conversion/strtod.cc)

target_include_directories(double-conversion PUBLIC .)

target_compile_reactnative_options(double-conversion PRIVATE)
target_compile_options(double-conversion PRIVATE -Wno-unused-variable -Wno-unused-local-typedefs)

