# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -std=c++17 -Wall -DLOG_TAG=\"Fabric\")

add_library(
        rrc_text
        SHARED
        BaseTextProps.cpp
        BaseTextShadowNode.cpp
        ParagraphEventEmitter.cpp
        ParagraphProps.cpp
        ParagraphShadowNode.cpp
        ParagraphState.cpp
        RawTextProps.cpp
        RawTextShadowNode.cpp
        TextProps.cpp
        TextShadowNode.cpp
)

target_include_directories(rrc_text PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(rrc_text
        glog
        folly_json
        glog_init
        jsi
        react_debug
        react_render_attributedstring
        react_render_core
        react_render_debug
        react_render_graphics
        react_render_mapbuffer
        react_render_mounting
        react_render_textlayoutmanager
        react_render_uimanager
        react_utils
        rrc_view
        yoga
)
