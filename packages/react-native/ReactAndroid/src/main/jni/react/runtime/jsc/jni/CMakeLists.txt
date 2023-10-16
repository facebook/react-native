# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fvisibility=hidden -fexceptions -frtti)

file(GLOB jscinstance_SRC CONFIGURE_DEPENDS "*.cpp")
add_library(jscinstance SHARED ${jscinstance_SRC})

target_include_directories(jscinstance PUBLIC .)

target_link_libraries(
        jscinstance
        bridgeless
        jscruntime
        fbjni
        reactnativejni
)
