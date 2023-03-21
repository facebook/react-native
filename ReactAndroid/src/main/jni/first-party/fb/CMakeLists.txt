# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_library(fb
        SHARED
        assert.cpp
        log.cpp)

add_compile_options(
        -DLOG_TAG=\"libfb\"
        -DDISABLE_CPUCAP
        -DDISABLE_XPLAT
        -fexceptions
        -frtti
        -Wno-unused-parameter
        -Wno-error=unused-but-set-variable
        -DHAVE_POSIX_CLOCKS
)

# Yogacore needs to link towards android and log from the NDK libs
target_link_libraries(fb dl android log)

target_include_directories(fb PUBLIC include)
