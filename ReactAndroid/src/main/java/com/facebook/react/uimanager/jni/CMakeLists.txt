# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -std=c++17 -Wall -DLOG_TAG=\"ReactNative\")

add_library(uimanagerjni SHARED
        OnLoad.cpp
        ComponentNameResolverManager.cpp)

target_include_directories(uimanagerjni PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(uimanagerjni
        fb
        fbjni
        folly_futures
        folly_json
        glog
        glog_init
        rrc_native
        yoga
        callinvokerholder
        reactnativejni
        react_render_componentregistry)
