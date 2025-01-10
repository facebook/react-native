# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -std=c++20 -Wall -DLOG_TAG=\"ReactNative\")

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)

file(GLOB uimanagerjni_SRC CONFIGURE_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/*.cpp)
add_library(uimanagerjni
        OBJECT
            ${uimanagerjni_SRC}
            $<TARGET_OBJECTS:react_render_graphics>
            $<TARGET_OBJECTS:rrc_legacyviewmanagerinterop>
            $<TARGET_OBJECTS:rrc_view>
)
target_merge_so(uimanagerjni)

target_include_directories(uimanagerjni PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(uimanagerjni
        bridgelessnativeviewconfig
        callinvokerholder
        fbjni
        folly_runtime
        glog
        glog_init
        jsi
        log
        react_render_componentregistry
        reactnativejni
        rrc_native
        yoga
)
