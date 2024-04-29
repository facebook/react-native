# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB_RECURSE hermes_executor_SRC CONFIGURE_DEPENDS *.cpp)

add_library(hermes_executor
        SHARED
        ${hermes_executor_SRC}
)
target_compile_options(
        hermes_executor
        PRIVATE
        $<$<CONFIG:Debug>:-DHERMES_ENABLE_DEBUGGER=1>
        -std=c++20
        -fexceptions
)
target_include_directories(hermes_executor PRIVATE .)
target_link_libraries(
        hermes_executor
        hermes_executor_common
        jsireact
        fb
        fbjni
        folly_runtime
        hermes-engine::libhermes
        jsi
        reactnativejni
)
