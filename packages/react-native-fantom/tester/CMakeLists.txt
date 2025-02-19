# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

project(fantom_tester)

# Convert input paths to CMake format (with forward slashes)
file(TO_CMAKE_PATH "${REACT_COMMON_DIR}" REACT_COMMON_DIR)

# Make sure every shared lib includes a .note.gnu.build-id header
add_link_options(-Wl,--build-id)

function(add_react_common_subdir relative_path)
  add_subdirectory(${REACT_COMMON_DIR}/${relative_path} src/${relative_path})
endfunction()

# Third-party downloaded targets

# Common targets
add_react_common_subdir(yoga)

file(GLOB SOURCES "src/*.cpp" "src/*.h")
add_executable(fantom_tester ${SOURCES})

target_link_libraries(fantom_tester PUBLIC yogacore)

target_compile_options(fantom_tester
  PRIVATE
    -Wall
    -Werror
    -fexceptions
    -frtti
    -std=c++20)
