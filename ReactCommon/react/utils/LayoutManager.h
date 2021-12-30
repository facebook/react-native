/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/core/LayoutPrimitives.h>
#include <react/renderer/core/conversions.h>
#ifdef ANDROID
#include <react/common/mapbuffer/ReadableMapBuffer.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif
#include <string>

namespace facebook {
namespace react {

#ifdef ANDROID

using namespace facebook::jni;

Size measureAndroidComponent(
    const ContextContainer::Shared &contextContainer,
    Tag rootTag,
    std::string componentName,
    folly::dynamic localData,
    folly::dynamic props,
    folly::dynamic state,
    float minWidth,
    float maxWidth,
    float minHeight,
    float maxHeight,
    jfloatArray attachmentPositions) {
  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer->at<jni::global_ref<jobject>>("FabricUIManager");

  static auto measure =
      jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
          ->getMethod<jlong(
              jint,
              jstring,
              ReadableMap::javaobject,
              ReadableMap::javaobject,
              ReadableMap::javaobject,
              jfloat,
              jfloat,
              jfloat,
              jfloat,
              jfloatArray)>("measure");

  auto componentNameRef = make_jstring(componentName);
  local_ref<ReadableNativeMap::javaobject> localDataRNM =
      ReadableNativeMap::newObjectCxxArgs(localData);
  local_ref<ReadableNativeMap::javaobject> propsRNM =
      ReadableNativeMap::newObjectCxxArgs(props);
  local_ref<ReadableNativeMap::javaobject> stateRNM =
      ReadableNativeMap::newObjectCxxArgs(state);

  local_ref<ReadableMap::javaobject> localDataRM =
      make_local(reinterpret_cast<ReadableMap::javaobject>(localDataRNM.get()));
  local_ref<ReadableMap::javaobject> propsRM =
      make_local(reinterpret_cast<ReadableMap::javaobject>(propsRNM.get()));
  local_ref<ReadableMap::javaobject> stateRM =
      make_local(reinterpret_cast<ReadableMap::javaobject>(stateRNM.get()));

  auto size = yogaMeassureToSize(measure(
      fabricUIManager,
      rootTag,
      componentNameRef.get(),
      localDataRM.get(),
      propsRM.get(),
      stateRM.get(),
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      attachmentPositions));

  // Explicitly release smart pointers to free up space faster in JNI tables
  componentNameRef.reset();
  localDataRM.reset();
  localDataRNM.reset();
  propsRM.reset();
  propsRNM.reset();
  stateRM.reset();
  stateRNM.reset();

  return size;
}

Size measureAndroidComponentMapBuffer(
    const ContextContainer::Shared &contextContainer,
    Tag rootTag,
    std::string componentName,
    MapBuffer &localData,
    MapBuffer &props,
    float minWidth,
    float maxWidth,
    float minHeight,
    float maxHeight,
    jfloatArray attachmentPositions) {
  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer->at<jni::global_ref<jobject>>("FabricUIManager");
  auto componentNameRef = make_jstring(componentName);

  static auto measure =
      jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
          ->getMethod<jlong(
              jint,
              jstring,
              ReadableMapBuffer::javaobject,
              ReadableMapBuffer::javaobject,
              jfloat,
              jfloat,
              jfloat,
              jfloat,
              jfloatArray)>("measureMapBuffer");

  auto localDataMap =
      ReadableMapBuffer::createWithContents(std::move(localData));
  auto propsMap = ReadableMapBuffer::createWithContents(std::move(props));

  auto size = yogaMeassureToSize(measure(
      fabricUIManager,
      rootTag,
      componentNameRef.get(),
      localDataMap.get(),
      propsMap.get(),
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      attachmentPositions));

  // Explicitly release smart pointers to free up space faster in JNI tables
  componentNameRef.reset();
  localDataMap.reset();
  propsMap.reset();
  return size;
}

#endif

} // namespace react
} // namespace facebook
