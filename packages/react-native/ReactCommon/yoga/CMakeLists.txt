# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -O3 -Wall)

file(GLOB_RECURSE yogacore_SRC CONFIGURE_DEPENDS yoga/*.cpp)
add_library(yogacore STATIC ${yogacore_SRC})

target_include_directories(yogacore PUBLIC .)

target_link_libraries(yogacore android log)
