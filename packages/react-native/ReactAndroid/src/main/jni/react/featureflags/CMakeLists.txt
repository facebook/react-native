# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)

file(GLOB featureflagsjni_SRCS CONFIGURE_DEPENDS *.cpp)

add_library(
        featureflagsjni
        SHARED
        ${featureflagsjni_SRCS}
)

target_include_directories(featureflagsjni PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(
        featureflagsjni
        fb
        fbjni
        react_featureflags
        reactnativejni
)

target_compile_options(
        featureflagsjni
        PRIVATE
        -DLOG_TAG=\"ReactNative\"
        -fexceptions
        -frtti
        -std=c++20
        -Wall
)
