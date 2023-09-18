# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB bridgeless_SRC "*.cpp")

add_library(bridgeless
        STATIC
        ${bridgeless_SRC}
)
target_compile_options(
        bridgeless
        PRIVATE
        $<$<CONFIG:Debug>:-DHERMES_ENABLE_DEBUGGER=1>
        -std=c++20
        -fexceptions
)
target_include_directories(bridgeless PUBLIC .)

find_library(LIBHERMES NAMES hermes-engine::libhermes)
if (LIBHERMES)
    target_link_libraries(bridgeless hermes-engine::libhermes)
endif ()

target_link_libraries(
        bridgeless
        jserrorhandler
        fabricjni
        turbomodulejsijni
        fb
        jsi
        jsireact
)
