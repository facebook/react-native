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

file(GLOB_RECURSE runtimeexecutor_SRC CONFIGURE_DEPENDS *.cpp *.h)

add_library(runtimeexecutor OBJECT ${runtimeexecutor_SRC})

target_include_directories(runtimeexecutor PUBLIC .)

target_link_libraries(runtimeexecutor jsi)
