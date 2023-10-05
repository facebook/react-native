# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-std=c++20)

file(GLOB_RECURSE bridgeless_hermes_SRC CONFIGURE_DEPENDS *.cpp)
add_library(
        bridgelesshermes
        STATIC
        ${bridgeless_hermes_SRC}
)
target_include_directories(bridgelesshermes PUBLIC .)

target_link_libraries(bridgelesshermes
        jsireact
        hermes-engine::libhermes
        hermes_inspector_modern
        jsi
        hermes_executor_common
)

if(${CMAKE_BUILD_TYPE} MATCHES Debug)
        target_compile_options(
                bridgelesshermes
                PRIVATE
                -DHERMES_ENABLE_DEBUGGER=1
        )
endif()
