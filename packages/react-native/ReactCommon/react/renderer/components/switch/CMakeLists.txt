# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)

file(GLOB rrc_switch_SRCS CONFIGURE_DEPENDS androidswitch/react/renderer/components/androidswitch/*.cpp)

add_library(
        rrc_switch
        STATIC
        ${rrc_switch_SRCS}
)

target_include_directories(rrc_switch PUBLIC androidswitch/)

target_link_libraries(
        rrc_switch
        glog
        fbjni
        folly_runtime
        glog_init
        react_codegen_rncore
        react_debug
        react_render_componentregistry
        react_render_core
        react_render_debug
        react_render_graphics
        react_render_uimanager
        reactnativejni
        rrc_view
        yoga
)

target_compile_options(
        rrc_switch
        PRIVATE
        -DLOG_TAG=\"Fabric\"
        -fexceptions
        -frtti
        -std=c++17
        -Wall
        -Wpedantic
        -Wno-gnu-zero-variadic-macro-arguments
)
