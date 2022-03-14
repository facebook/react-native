# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -std=c++17 -Wall -DLOG_TAG=\"Fabric\")

add_library(
        rrc_textinput
        SHARED
        androidtextinput/react/renderer/components/androidtextinput/AndroidTextInputProps.cpp
        androidtextinput/react/renderer/components/androidtextinput/AndroidTextInputShadowNode.cpp
        androidtextinput/react/renderer/components/androidtextinput/AndroidTextInputState.cpp
)

target_include_directories(rrc_textinput
        PUBLIC
          ${CMAKE_CURRENT_SOURCE_DIR}/androidtextinput/
        PRIVATE
          ${CMAKE_CURRENT_SOURCE_DIR}/androidtextinput/react/renderer/components/androidtextinput/
)

target_link_libraries(rrc_textinput
        glog
        folly_json
        glog_init
        jsi
        react_debug
        react_render_attributedstring
        react_render_componentregistry
        react_render_core
        react_render_debug
        react_render_graphics
        react_render_imagemanager
        react_render_mapbuffer
        react_render_mounting
        react_render_textlayoutmanager
        react_render_uimanager
        react_utils
        rrc_image
        rrc_text
        rrc_view
        yoga
)
