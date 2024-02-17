# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -std=c++20 -Wall -DLOG_TAG=\"ReactNative\")

file(GLOB uimanagerjni_SRC CONFIGURE_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/*.cpp)
add_library(uimanagerjni SHARED ${uimanagerjni_SRC})

target_include_directories(uimanagerjni PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(uimanagerjni
        fb
        fbjni
        folly_runtime
        glog
        glog_init
        bridgelessnativeviewconfig
        rrc_native
        yoga
        callinvokerholder
        reactnativejni
        react_render_componentregistry)
