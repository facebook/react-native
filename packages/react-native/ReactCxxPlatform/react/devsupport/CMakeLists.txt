# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_cxx_platform_react_devsupport_SRC CONFIGURE_DEPENDS
  *.cpp
  inspector/*.cpp)
add_library(react_cxx_platform_react_devsupport OBJECT ${react_cxx_platform_react_devsupport_SRC})

target_include_directories(react_cxx_platform_react_devsupport PUBLIC ${REACT_CXX_PLATFORM_DIR})

target_link_libraries(react_cxx_platform_react_devsupport
      glog
      nlohmann_json
      folly_runtime
      jsi
      OpenSSL::Crypto
      react_cxx_platform_react_http
      react_cxx_platform_react_nativemodule
      react_cxx_platform_react_renderer_scheduler
      react_cxx_platform_react_renderer_scheduler
      react_cxx_platform_react_threading
      react_codegen_rncore
      jsinspector
      react_debug
      react_renderer_graphics
)
target_compile_reactnative_options(react_cxx_platform_react_devsupport PRIVATE)
target_compile_options(react_cxx_platform_react_devsupport PRIVATE -Wpedantic -Wno-deprecated-declarations)
