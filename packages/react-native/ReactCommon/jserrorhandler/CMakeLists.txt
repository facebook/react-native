# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(-std=c++20)

file(GLOB_RECURSE js_error_handler_SRC CONFIGURE_DEPENDS *.cpp)
add_library(
        jserrorhandler
        STATIC
        ${js_error_handler_SRC}
)
target_include_directories(jserrorhandler PUBLIC .)
target_link_libraries(jserrorhandler
        jsi
        folly_runtime
        mapbufferjni
)
