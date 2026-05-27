# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Convert input paths to CMake format (with forward slashes)
file(TO_CMAKE_PATH "${REACT_THIRD_PARTY_NDK_DIR}" REACT_THIRD_PARTY_NDK_DIR)
file(TO_CMAKE_PATH "${REACT_COMMON_DIR}" REACT_COMMON_DIR)
file(TO_CMAKE_PATH "${REACT_CXX_PLATFORM_DIR}" REACT_CXX_PLATFORM_DIR)
file(TO_CMAKE_PATH "${FANTOM_CODEGEN_DIR}" FANTOM_CODEGEN_DIR)
file(TO_CMAKE_PATH "${FANTOM_THIRD_PARTY_DIR}" FANTOM_THIRD_PARTY_DIR)

function(add_react_third_party_ndk_subdir relative_path)
  add_subdirectory(${REACT_THIRD_PARTY_NDK_DIR}/${relative_path} ${relative_path})
endfunction()

function(add_third_party_subdir relative_path)
  add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/third-party/${relative_path} ${relative_path})
endfunction()

function(add_react_common_subdir relative_path)
  add_subdirectory(${REACT_COMMON_DIR}/${relative_path} ReactCommon/${relative_path})
endfunction()

function(add_react_cxx_platform_subdir relative_path)
  add_subdirectory(${REACT_CXX_PLATFORM_DIR}/${relative_path} ReactCxxPlatform/${relative_path})
endfunction()

function(add_fantom_third_party_subdir relative_path)
  add_subdirectory(${FANTOM_THIRD_PARTY_DIR}/${relative_path} ${relative_path})
endfunction()
