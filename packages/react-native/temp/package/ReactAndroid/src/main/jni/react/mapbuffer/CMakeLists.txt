# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)

add_compile_options(-fexceptions -frtti -std=c++20 -Wall -DLOG_TAG=\"Fabric\")

file(GLOB mapbuffer_SRC CONFIGURE_DEPENDS
        ${CMAKE_CURRENT_SOURCE_DIR}/react/common/mapbuffer/*.cpp)

add_library(mapbufferjni OBJECT ${mapbuffer_SRC})

target_include_directories(mapbufferjni
        PUBLIC
          ${CMAKE_CURRENT_SOURCE_DIR}
        PRIVATE
          ${CMAKE_CURRENT_SOURCE_DIR}/react/common/mapbuffer/
)

target_merge_so(mapbufferjni)

target_link_libraries(mapbufferjni
        fb
        fbjni
        folly_runtime
        glog
        glog_init
        react_debug
        react_render_mapbuffer
        react_utils
        react_config
        yoga
)
