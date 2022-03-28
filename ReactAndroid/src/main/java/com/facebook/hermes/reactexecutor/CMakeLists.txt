# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB_RECURSE hermes_executor_SRC CONFIGURE_DEPENDS *.cpp)

if(${CMAKE_BUILD_TYPE} MATCHES Debug)
        set(HERMES_TARGET_SUFFIX debug)
else()
        set(HERMES_TARGET_SUFFIX release)
endif()

set(HERMES_TARGET_NAME hermes-executor-${HERMES_TARGET_SUFFIX})

add_library(
        ${HERMES_TARGET_NAME}
        SHARED
        ${hermes_executor_SRC}
)
target_compile_options(
        ${HERMES_TARGET_NAME}
        PRIVATE
        $<$<CONFIG:Debug>:-DHERMES_ENABLE_DEBUGGER=1>
        -fexceptions
)
target_include_directories(${HERMES_TARGET_NAME} PRIVATE .)
target_link_libraries(
        ${HERMES_TARGET_NAME}
        hermes-executor-common
        jsireact
        fb
        fbjni
        folly_runtime
        hermes-engine::libhermes
        jsi
        reactnativejni
)
