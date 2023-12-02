# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB_RECURSE bridgeless_jni_SRC CONFIGURE_DEPENDS *.cpp)

add_library(rninstance
        SHARED
        ${bridgeless_jni_SRC}
)
target_compile_options(
        rninstance
        PRIVATE
        $<$<CONFIG:Debug>:-DHERMES_ENABLE_DEBUGGER=1>
        -std=c++20
        -fexceptions
)
target_include_directories(rninstance PUBLIC .)
target_link_libraries(
        rninstance
        fabricjni
        turbomodulejsijni
        fb
        jsi
        fbjni
        bridgeless
)
