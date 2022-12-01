# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB hermesinspector_SRC CONFIGURE_DEPENDS *.cpp detail/*.cpp chrome/*.cpp)

add_library(hermes_inspector
        STATIC
        ${hermesinspector_SRC})

target_compile_options(
        hermes_inspector
        PRIVATE
        -DHERMES_ENABLE_DEBUGGER=1
        -DHERMES_INSPECTOR_FOLLY_KLUDGE=1
        -std=c++17
        -fexceptions
)

target_include_directories(hermes_inspector PUBLIC ${REACT_COMMON_DIR})
target_link_libraries(hermes_inspector
        jsinspector
        fb
        fbjni
        folly_futures
        folly_runtime
        glog
        hermes-engine::libhermes
        jsi)
