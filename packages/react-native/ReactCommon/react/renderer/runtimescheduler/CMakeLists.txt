# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_renderer_runtimescheduler_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_renderer_runtimescheduler STATIC ${react_renderer_runtimescheduler_SRC})

target_include_directories(react_renderer_runtimescheduler PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(react_renderer_runtimescheduler
        callinvoker
        jsi
        react_debug
        react_performance_timeline
        react_renderer_consistency
        react_renderer_debug
        react_timing
        react_utils
        react_featureflags
        runtimeexecutor
        jsinspector_tracing)
target_compile_reactnative_options(react_renderer_runtimescheduler PRIVATE)
target_compile_options(react_renderer_runtimescheduler PRIVATE -Wpedantic)

# POC (public C++ API surface reduction): this module exposes a single public
# umbrella header, react/renderer/runtimescheduler/RuntimeScheduler.umbrella.h.
# Including any other module header directly is gated by an opt-in guard
# (RuntimeSchedulerUmbrellaGuard.h) that is inert unless
# REACT_RUNTIMESCHEDULER_ENFORCE_UMBRELLA is defined.
#
# Unlike Buck, CMake exposes the whole include directory, so the individual
# headers (and the private RuntimeScheduler_Modern.h / RuntimeScheduler_Legacy.h)
# remain physically includable here. The only way to enforce "umbrella only" in
# the OSS build is the guard macro. To enable it, uncomment the block below.
# NOTE: this breaks any consumer that still includes the individual headers
# directly, so only enable it after migrating consumers to the umbrella.
#
# target_compile_definitions(react_renderer_runtimescheduler
#         PRIVATE REACT_RUNTIMESCHEDULER_BUILDING          # this library's own .cpp may include the headers directly
#         PUBLIC  REACT_RUNTIMESCHEDULER_ENFORCE_UMBRELLA) # consumers must go through the umbrella
