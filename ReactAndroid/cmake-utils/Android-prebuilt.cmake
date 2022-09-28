# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This configuration provides access to most common React Native prebuilt .so files
# to avoid recompiling each of the libraries outside of ReactAndroid NDK compilation.
# Hosting app's/library's CMakeLists.txt can include this Android-prebuilt.cmake file to
# get access to those libraries to depend on.
# NOTES:
# * Currently, it assumes building React Native from source.
# * Not every .so is listed here (yet).
# * Static libs are not covered here (yet).

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# FIRST_PARTY_NDK_DIR contains vendored source code from other FB frameworks
# like Yoga, FBJNI, etc.
set(FIRST_PARTY_NDK_DIR ${REACT_ANDROID_DIR}/src/main/jni/first-party)
# THIRD_PARTY_NDK_DIR is where we're downloading third-party native
# frameworks such as libevent, boost, etc.
set(THIRD_PARTY_NDK_DIR ${REACT_ANDROID_BUILD_DIR}/third-party-ndk)
# REACT_ANDROID_SRC_DIR is the root of ReactAndroid source code (Java & JNI)
set(REACT_ANDROID_SRC_DIR ${REACT_ANDROID_DIR}/src/main)
# REACT_COMMON_DIR is the root of ReactCommon source code (C++ only)
set(REACT_COMMON_DIR ${REACT_ANDROID_DIR}/../ReactCommon)
# REACT_GENERATED_SRC_DIR is the folder where the codegen for rncore will output
set(REACT_GENERATED_SRC_DIR ${REACT_ANDROID_BUILD_DIR}/generated/source)
# REACT_NDK_EXPORT_DIR is the folder where the .so will be copied for being inported
# in the local project by the packageReactDebugNdkLibs/packageReactReleaseNdkLibs
set(REACT_NDK_EXPORT_DIR ${PROJECT_BUILD_DIR}/react-ndk/exported)

## fb
add_library(fb SHARED IMPORTED GLOBAL)
set_target_properties(fb
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libfb.so)
target_include_directories(fb
        INTERFACE
        ${FIRST_PARTY_NDK_DIR}/fb/include)

## folly_runtime
add_library(folly_runtime SHARED IMPORTED GLOBAL)
set_target_properties(folly_runtime
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libfolly_runtime.so)
target_include_directories(folly_runtime
        INTERFACE
        ${THIRD_PARTY_NDK_DIR}/boost/boost_1_76_0
        ${THIRD_PARTY_NDK_DIR}/double-conversion
        ${THIRD_PARTY_NDK_DIR}/folly)
target_compile_options(folly_runtime
        INTERFACE
        -DFOLLY_NO_CONFIG=1
        -DFOLLY_HAVE_CLOCK_GETTIME=1
        -DFOLLY_HAVE_MEMRCHR=1
        -DFOLLY_USE_LIBCPP=1
        -DFOLLY_MOBILE=1
        -DFOLLY_HAVE_XSI_STRERROR_R=1)

## glog
add_library(glog SHARED IMPORTED GLOBAL)
set_target_properties(glog
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libglog.so)
target_include_directories(glog INTERFACE ${THIRD_PARTY_NDK_DIR}/glog/exported)

## yoga
add_library(yoga SHARED IMPORTED GLOBAL)
set_target_properties(yoga
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libyoga.so)
target_include_directories(yoga
        INTERFACE
        ${FIRST_PARTY_NDK_DIR}/yogajni/jni
        ${REACT_COMMON_DIR}/yoga)
target_compile_options(yoga
        INTERFACE
        -fvisibility=hidden
        -fexceptions
        -frtti
        -O3)
target_link_libraries(yoga INTERFACE log android)

## react_nativemodule_core
add_library(react_nativemodule_core SHARED IMPORTED GLOBAL)
set_target_properties(react_nativemodule_core
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libreact_nativemodule_core.so)
target_include_directories(react_nativemodule_core
        INTERFACE
        ${REACT_ANDROID_SRC_DIR}/jni
        ${REACT_COMMON_DIR}
        ${REACT_COMMON_DIR}/callinvoker
        ${REACT_COMMON_DIR}/jsi
        ${REACT_COMMON_DIR}/react/nativemodule/core
        ${REACT_COMMON_DIR}/react/nativemodule/core/platform/android)
target_link_libraries(react_nativemodule_core INTERFACE folly_runtime)

## react_render_core
add_library(react_render_core SHARED IMPORTED GLOBAL)
set_target_properties(react_render_core
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libreact_render_core.so)
target_include_directories(react_render_core
        INTERFACE
        ${REACT_COMMON_DIR}
        ${REACT_COMMON_DIR}/react/renderer/core)

## react_render_graphics
add_library(react_render_graphics SHARED IMPORTED GLOBAL)
set_target_properties(react_render_graphics
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libreact_render_graphics.so)
target_include_directories(react_render_graphics
        INTERFACE
        ${REACT_COMMON_DIR}/react/renderer/graphics
        ${REACT_COMMON_DIR}/react/renderer/graphics/platform/cxx)

## react_render_imagemanager
add_library(react_render_imagemanager SHARED IMPORTED GLOBAL)
set_target_properties(react_render_imagemanager
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libreact_render_imagemanager.so)
target_include_directories(react_render_imagemanager
        INTERFACE
        ${REACT_COMMON_DIR}/react/renderer/imagemanager
        ${REACT_COMMON_DIR}/react/renderer/imagemanager/platform/cxx)

## react_render_mounting
add_library(react_render_mounting SHARED IMPORTED GLOBAL)
set_target_properties(react_render_mounting
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libreact_render_mounting.so)
target_include_directories(react_render_mounting INTERFACE ${REACT_COMMON_DIR}/react/renderer/mounting)

## react_render_mapbuffer
add_library(react_render_mapbuffer SHARED IMPORTED GLOBAL)
set_target_properties(react_render_mapbuffer
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libreact_render_mapbuffer.so)
target_include_directories(react_render_mapbuffer INTERFACE ${REACT_COMMON_DIR}/react/renderer/mapbuffer)

## rrc_view
add_library(rrc_view SHARED IMPORTED GLOBAL)
set_target_properties(rrc_view
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/librrc_view.so)
target_include_directories(rrc_view INTERFACE ${REACT_COMMON_DIR}/react/renderer/components/view)

## fabricjni
add_library(fabricjni SHARED IMPORTED GLOBAL)
set_target_properties(fabricjni
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libfabricjni.so)
target_include_directories(fabricjni INTERFACE ${REACT_ANDROID_SRC_DIR}/jni/react/fabric)

## react_newarchdefaults
add_library(react_newarchdefaults SHARED IMPORTED GLOBAL)
set_target_properties(react_newarchdefaults
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libreact_newarchdefaults.so)
target_include_directories(react_newarchdefaults INTERFACE ${REACT_ANDROID_SRC_DIR}/jni/react/newarchdefaults)

## jsi
add_library(jsi SHARED IMPORTED GLOBAL)
set_target_properties(jsi
        PROPERTIES
        IMPORTED_LOCATION
        ${REACT_NDK_EXPORT_DIR}/${ANDROID_ABI}/libjsi.so)
target_include_directories(jsi INTERFACE ${REACT_COMMON_DIR}/jsi)

## fbjni
add_subdirectory(${FIRST_PARTY_NDK_DIR}/fbjni fbjni_build)
