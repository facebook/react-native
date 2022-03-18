# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -std=c++17 -Wall -DLOG_TAG=\"Fabric\")

add_library(
        react_render_animations
        SHARED
        LayoutAnimationDriver.cpp
        LayoutAnimationKeyFrameManager.cpp
        utils.cpp
)

target_include_directories(react_render_animations PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(react_render_animations
        folly_futures
        folly_json
        glog
        glog_init
        jsi
        react_config
        react_debug
        react_render_componentregistry
        react_render_core
        react_render_debug
        react_render_graphics
        react_render_mounting
        react_render_uimanager
        rrc_view
        runtimeexecutor
        yoga
)
