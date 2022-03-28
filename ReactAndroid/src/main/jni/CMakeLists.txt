# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

project(ReactAndroid)

# Make sure every shared lib includes a .note.gnu.build-id header
add_link_options(-Wl,--build-id)
add_compile_options(-Wall -Werror -std=c++1y)

function(add_react_android_subdir relative_path)
  add_subdirectory(${REACT_ANDROID_DIR}/${relative_path} ReactAndroid/${relative_path})
endfunction()

function(add_react_third_party_ndk_subdir relative_path)
  add_react_android_subdir(build/third-party-ndk/${relative_path})
endfunction()

function(add_react_common_subdir relative_path)
  add_subdirectory(${REACT_COMMON_DIR}/${relative_path} ReactCommon/${relative_path})
endfunction()

# Third-party prefabs
find_package(hermes-engine REQUIRED CONFIG)

# Third-party downloaded targets
add_react_third_party_ndk_subdir(glog)
add_react_third_party_ndk_subdir(boost)
add_react_third_party_ndk_subdir(double-conversion)
add_react_third_party_ndk_subdir(fmt)
add_react_third_party_ndk_subdir(libevent)
add_react_third_party_ndk_subdir(folly)
add_react_third_party_ndk_subdir(jsc)

# Common targets
add_react_common_subdir(yoga)
add_react_common_subdir(runtimeexecutor)
add_react_common_subdir(reactperflogger)
add_react_common_subdir(logger)
add_react_common_subdir(jsiexecutor)
add_react_common_subdir(cxxreact)
add_react_common_subdir(jsi)
add_react_common_subdir(butter)
add_react_common_subdir(callinvoker)
add_react_common_subdir(jsinspector)
add_react_common_subdir(hermes/executor)
add_react_common_subdir(hermes/inspector)
add_react_common_subdir(react/renderer/runtimescheduler)
add_react_common_subdir(react/debug)
add_react_common_subdir(react/config)
add_react_common_subdir(react/renderer/animations)
add_react_common_subdir(react/renderer/attributedstring)
add_react_common_subdir(react/renderer/componentregistry)
add_react_common_subdir(react/renderer/mounting)
add_react_common_subdir(react/renderer/scheduler)
add_react_common_subdir(react/renderer/telemetry)
add_react_common_subdir(react/renderer/templateprocessor)
add_react_common_subdir(react/renderer/uimanager)
add_react_common_subdir(react/renderer/core)
add_react_common_subdir(react/renderer/graphics)
add_react_common_subdir(react/renderer/debug)
add_react_common_subdir(react/renderer/imagemanager)
add_react_common_subdir(react/renderer/components/view)
add_react_common_subdir(react/renderer/components/switch)
add_react_common_subdir(react/renderer/components/textinput)
add_react_common_subdir(react/renderer/components/progressbar)
add_react_common_subdir(react/renderer/components/slider)
add_react_common_subdir(react/renderer/components/root)
add_react_common_subdir(react/renderer/components/image)
add_react_common_subdir(react/renderer/componentregistry/native)
add_react_common_subdir(react/renderer/components/text)
add_react_common_subdir(react/renderer/components/unimplementedview)
add_react_common_subdir(react/renderer/components/modal)
add_react_common_subdir(react/renderer/components/scrollview)
add_react_common_subdir(react/renderer/leakchecker)
add_react_common_subdir(react/renderer/textlayoutmanager)
add_react_common_subdir(react/utils)
add_react_common_subdir(react/bridging)
add_react_common_subdir(react/renderer/mapbuffer)
add_react_common_subdir(react/nativemodule/core)

# ReactAndroid JNI targets
add_react_android_subdir(build/generated/source/codegen/jni)
add_react_android_subdir(src/main/java/com/facebook/hermes/reactexecutor)
add_react_android_subdir(src/main/jni/first-party/fbjni)
add_react_android_subdir(src/main/jni/first-party/fb)
add_react_android_subdir(src/main/jni/first-party/fbgloginit)
add_react_android_subdir(src/main/jni/first-party/yogajni)
add_react_android_subdir(src/main/jni/react/jni)
add_react_android_subdir(src/main/java/com/facebook/react/reactperflogger/jni)
add_react_android_subdir(src/main/java/com/facebook/react/jscexecutor)
add_react_android_subdir(src/main/java/com/facebook/react/turbomodule/core/jni)
add_react_android_subdir(src/main/java/com/facebook/react/uimanager/jni)
add_react_android_subdir(src/main/java/com/facebook/react/common/mapbuffer/jni)
add_react_android_subdir(src/main/java/com/facebook/react/fabric/jni)
add_react_android_subdir(src/main/java/com/facebook/react/modules/blob/jni)
add_react_android_subdir(src/main/java/com/facebook/hermes/instrumentation/)

