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
        -Wpedantic
        -Wno-gnu-zero-variadic-macro-arguments)

file(GLOB reactperflogger_SRC CONFIGURE_DEPENDS reactperflogger/*.cpp)
add_library(reactperflogger STATIC ${reactperflogger_SRC})

target_include_directories(reactperflogger PUBLIC .)
