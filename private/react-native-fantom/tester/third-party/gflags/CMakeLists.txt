# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

add_library(gflags STATIC
  gflags/gflags.cc
  gflags/gflags_completions.cc
  gflags/gflags_reporting.cc)

target_include_directories(gflags PUBLIC .)

target_compile_options(gflags PRIVATE
  -DHAVE_STDINT_H
  -DHAVE_SYS_TYPES_H
  -DHAVE_INTTYPES_H
  -DHAVE_SYS_STAT_H
  -DHAVE_UNISTD_H
  -DHAVE_STRTOLL
  -DHAVE_STRTOQ
  -DHAVE_RWLOCK
  -DGFLAGS_INTTYPES_FORMAT_C99
  -DGFLAGS_IS_A_DLL=0
  -DHAVE_FNMATCH_H
  -DHAVE_PTHREAD
  -lpthread)
