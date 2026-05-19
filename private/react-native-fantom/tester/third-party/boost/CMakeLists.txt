# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

add_library(boost INTERFACE)

set_target_properties(boost PROPERTIES LINKER_LANGUAGE CXX)

target_include_directories(boost INTERFACE ${REACT_THIRD_PARTY_NDK_DIR}/boost/boost_1_83_0)
target_compile_options(boost INTERFACE -fexceptions -frtti)
