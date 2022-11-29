# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-std=c++17)

file(GLOB_RECURSE hermes_executor_SRC CONFIGURE_DEPENDS *.cpp)
add_library(
        hermes_executor_common
        STATIC
        ${hermes_executor_SRC}
)
target_include_directories(hermes_executor_common PUBLIC .)
target_link_libraries(hermes_executor_common
        jsireact
        hermes-engine::libhermes
        jsi
        debug
        hermes_inspector
)

if(${CMAKE_BUILD_TYPE} MATCHES Debug)
        target_compile_options(
                hermes_executor_common
                PRIVATE
                -DHERMES_ENABLE_DEBUGGER=1
        )
endif()
