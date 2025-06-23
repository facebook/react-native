# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(
        -fexceptions
        -frtti
        -std=c++20
        -Wall
        -Wpedantic)


file(GLOB reactperflogger_SRC CONFIGURE_DEPENDS
        reactperflogger/*.cpp
        fusebox/*.cpp)
add_library(reactperflogger OBJECT ${reactperflogger_SRC})

target_include_directories(reactperflogger PUBLIC .)

target_link_libraries(reactperflogger folly_runtime)
