# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -std=c++17 -Wall -DLOG_TAG=\"Fabric\")

add_library(
        mapbufferjni
        SHARED
        react/common/mapbuffer/OnLoad.cpp
        react/common/mapbuffer/ReadableMapBuffer.cpp
)

target_include_directories(mapbufferjni
        PUBLIC
          ${CMAKE_CURRENT_SOURCE_DIR}
        PRIVATE
          ${CMAKE_CURRENT_SOURCE_DIR}/react/common/mapbuffer/
)

target_link_libraries(mapbufferjni
        fb
        fbjni
        folly_futures
        folly_json
        glog
        glog_init
        react_debug
        react_render_mapbuffer
        react_utils
        react_config
        yoga
)
