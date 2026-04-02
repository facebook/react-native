# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_devsupportjni_SRC CONFIGURE_DEPENDS *.cpp)

add_library(react_devsupportjni OBJECT ${react_devsupportjni_SRC})

target_merge_so(react_devsupportjni)

target_include_directories(react_devsupportjni PUBLIC .)

target_link_libraries(react_devsupportjni
        fbjni
        jsinspector
        react_networking)

target_compile_reactnative_options(react_devsupportjni PRIVATE)

if(${CMAKE_BUILD_TYPE} MATCHES Debug OR REACT_NATIVE_DEBUG_OPTIMIZED)
  target_compile_options(react_devsupportjni PRIVATE
          -DREACT_NATIVE_DEBUGGER_ENABLED=1
          -DREACT_NATIVE_DEBUGGER_ENABLED_DEVONLY=1
  )
endif ()
