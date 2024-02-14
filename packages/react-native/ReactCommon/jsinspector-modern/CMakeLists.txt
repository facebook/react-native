# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_compile_options(
        -fexceptions
        -std=c++20)

file(GLOB jsinspector_SRC CONFIGURE_DEPENDS *.cpp)
# jsinspector contains singletons that hold app-global state (InspectorFlags, InspectorImpl).
# Placing it in a shared library makes the singletons safe to use from arbitrary shared libraries
# (even ones that don't depend on one another).
add_library(jsinspector SHARED ${jsinspector_SRC})

target_include_directories(jsinspector PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(jsinspector
        folly_runtime
        glog
        react_featureflags
        runtimeexecutor
)
