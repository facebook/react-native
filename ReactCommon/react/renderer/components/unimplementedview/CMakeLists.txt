# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -std=c++17 -Wall -DLOG_TAG=\"Fabric\")

add_library(
        rrc_unimplementedview
        SHARED
        UnimplementedViewComponentDescriptor.cpp
        UnimplementedViewProps.cpp
        UnimplementedViewShadowNode.cpp
)

target_include_directories(rrc_unimplementedview PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(rrc_unimplementedview
        glog
        folly_futures
        folly_json
        glog_init
        jsi
        react_debug
        react_render_core
        react_render_debug
        react_render_graphics
        rrc_view
        yoga
)
