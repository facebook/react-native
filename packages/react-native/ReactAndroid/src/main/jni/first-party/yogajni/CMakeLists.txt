# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(
        -fvisibility=hidden
        -fexceptions
        -frtti
        -O3)

file(GLOB yoga_SRC CONFIGURE_DEPENDS jni/*.cpp)
add_library(yoga SHARED ${yoga_SRC})

target_include_directories(yoga PUBLIC jni)

target_link_libraries(yoga yogacore fb fbjni log android)
