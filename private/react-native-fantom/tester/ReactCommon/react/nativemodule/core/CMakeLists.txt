# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)
file(GLOB react_nativemodule_core_SRC CONFIGURE_DEPENDS
        ${react_nativemodule_core_DIR}/ReactCommon/*.cpp)

add_library(react_nativemodule_core
        OBJECT
        ${react_nativemodule_core_SRC})

target_include_directories(react_nativemodule_core
        PUBLIC
          ${react_nativemodule_core_DIR}
        )

target_link_libraries(react_nativemodule_core
        folly_runtime
        glog
        jsi
        callinvoker
        react_bridging
        react_debug
        react_utils
        react_featureflags
        reactperflogger)
target_compile_reactnative_options(react_nativemodule_core PRIVATE)
target_compile_options(react_nativemodule_core PRIVATE -Wpedantic)
