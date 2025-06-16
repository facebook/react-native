# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

project(fantom_tester)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

# Convert input paths to CMake format (with forward slashes)
file(TO_CMAKE_PATH "${REACT_THIRD_PARTY_NDK_DIR}" REACT_THIRD_PARTY_NDK_DIR)
file(TO_CMAKE_PATH "${REACT_COMMON_DIR}" REACT_COMMON_DIR)

function(add_react_third_party_ndk_subdir relative_path)
  add_subdirectory(${REACT_THIRD_PARTY_NDK_DIR}/${relative_path} ${relative_path})
endfunction()

function(add_third_party_subdir relative_path)
  add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/third-party/${relative_path} ${relative_path})
endfunction()

function(add_react_common_subdir relative_path)
  add_subdirectory(${REACT_COMMON_DIR}/${relative_path} src/${relative_path})
endfunction()

function(add_fantom_third_party_subdir relative_path)
  add_subdirectory(${FANTOM_THIRD_PARTY_DIR}/${relative_path} ${relative_path})
endfunction()

# Third-party downloaded targets
add_react_third_party_ndk_subdir(glog)
# Boost in NDK is not compatible with desktop build
add_third_party_subdir(boost)
add_react_third_party_ndk_subdir(double-conversion)
add_react_third_party_ndk_subdir(fast_float)
add_react_third_party_ndk_subdir(fmt)
add_react_third_party_ndk_subdir(folly)
add_fantom_third_party_subdir(gflags)

# Common targets
add_react_common_subdir(yoga)
add_react_common_subdir(react/featureflags)

file(GLOB SOURCES "src/*.cpp" "src/*.h")
add_executable(fantom_tester ${SOURCES})

target_link_libraries(fantom_tester
  PRIVATE
    glog
    gflags
    boost
    double-conversion
    fast_float
    folly_runtime
    react_featureflags
    yogacore)

target_compile_options(fantom_tester
  PRIVATE
    -Wall
    -Werror
    -fexceptions
    -frtti
    -std=c++20)
