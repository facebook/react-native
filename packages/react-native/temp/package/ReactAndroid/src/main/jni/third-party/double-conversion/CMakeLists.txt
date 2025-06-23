# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-Wno-unused-variable -Wno-unused-local-typedefs)

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

