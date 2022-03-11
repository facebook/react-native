# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(
        -DLOG_TAG=\"Butter\"
        -fexceptions
        -frtti
        -std=c++17
        -Wall)

add_library(butter
        SHARED
        butter.h
        map.h
        mutex.h
        set.h
        small_vector.h
        )

set_target_properties(butter PROPERTIES LINKER_LANGUAGE CXX)

target_include_directories(butter PUBLIC .)

target_link_libraries(butter glog)
