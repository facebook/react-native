# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_featureflagsjni_SRCS CONFIGURE_DEPENDS *.cpp)

add_library(
        react_featureflagsjni
        OBJECT
        ${react_featureflagsjni_SRCS}
)

target_include_directories(react_featureflagsjni PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(
        react_featureflagsjni
        fbjni
        react_featureflags
        reactnativejni
)

target_merge_so(react_featureflagsjni)
target_compile_reactnative_options(react_featureflagsjni PRIVATE)
