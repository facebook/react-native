# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-std=c++11 -fexceptions)

add_library(fmt STATIC src/format.cc)

target_include_directories(fmt PUBLIC include)
