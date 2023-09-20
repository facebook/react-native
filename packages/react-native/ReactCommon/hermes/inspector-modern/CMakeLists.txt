# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB hermesinspectormodern_SRC CONFIGURE_DEPENDS *.cpp detail/*.cpp chrome/*.cpp)

add_library(hermes_inspector_modern
        STATIC
        ${hermesinspectormodern_SRC})

target_compile_options(
        hermes_inspector_modern
        PRIVATE
        -DHERMES_INSPECTOR_FOLLY_KLUDGE=1
        -std=c++20
        -fexceptions
)

if(${CMAKE_BUILD_TYPE} MATCHES Debug)
        target_compile_options(
                hermes_inspector_modern
                PRIVATE
                -DHERMES_ENABLE_DEBUGGER=1
        )
endif()

target_include_directories(hermes_inspector_modern PUBLIC ${REACT_COMMON_DIR})
target_link_libraries(hermes_inspector_modern
        jsinspector
        fb
        fbjni
        folly_futures
        folly_runtime
        glog
        hermes-engine::libhermes
        jsi)
