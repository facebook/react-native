# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-fexceptions -frtti -std=c++17 -Wall -DLOG_TAG=\"Fabric\")

file(GLOB react_render_uimanager_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_render_uimanager SHARED ${react_render_uimanager_SRC})

target_include_directories(react_render_uimanager PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(react_render_uimanager
        glog
        folly_runtime
        jsi
        react_debug
        react_render_componentregistry
        react_render_core
        react_render_debug
        react_render_graphics
        react_render_leakchecker
        react_render_runtimescheduler
        react_render_mounting
        react_config
        rrc_root
        rrc_view
        runtimeexecutor
)
