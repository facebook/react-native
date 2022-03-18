# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fvisibility=hidden -fexceptions -frtti)

file(GLOB jscexecutor_SRC CONFIGURE_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/*.cpp)
add_library(jscexecutor SHARED ${jscexecutor_SRC})

target_include_directories(jscexecutor PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(jscexecutor
        jsireact
        jscruntime
        fb
        fbjni
        folly_runtime
        jsi
        reactnativejni)
