# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# These ASM files are picked from the boost release separately,
# because the react native version does not include anything outside of headers.
# They are required for Folly futures to compile successfully.
ENABLE_LANGUAGE(ASM)
file(GLOB_RECURSE
        boostasm_SRC
        CONFIGURE_DEPENDS
        ${CMAKE_CURRENT_SOURCE_DIR}/asm/${ANDROID_ABI}/*.S)
add_library(boost STATIC ${boostasm_SRC})

set_target_properties(boost PROPERTIES LINKER_LANGUAGE CXX)

target_include_directories(boost PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/boost_1_76_0)

