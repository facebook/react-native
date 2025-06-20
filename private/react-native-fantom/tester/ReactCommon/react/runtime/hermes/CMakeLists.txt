# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB_RECURSE bridgelesshermes_SRC CONFIGURE_DEPENDS ${react_runtime_hermes_DIR}/*.cpp)
add_library(
        bridgelesshermes
        OBJECT
        ${bridgelesshermes_SRC}
)
target_include_directories(bridgelesshermes PUBLIC ${react_runtime_hermes_DIR}/.)

target_link_libraries(bridgelesshermes
        hermes-engine::libhermes
        hermes_executor_common
        hermes_inspector_modern
        jsitooling
        jsi
        jsinspector
)

target_compile_reactnative_options(bridgelesshermes PRIVATE)
if(${CMAKE_BUILD_TYPE} MATCHES Debug)
        target_compile_options(
                bridgelesshermes
                PRIVATE
                -DHERMES_ENABLE_DEBUGGER=1
        )
endif()
