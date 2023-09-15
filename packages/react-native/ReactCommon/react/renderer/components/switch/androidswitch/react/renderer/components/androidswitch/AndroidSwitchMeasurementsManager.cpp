/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidSwitchMeasurementsManager.h"

#include <fbjni/fbjni.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/core/conversions.h>

using namespace facebook::jni;

namespace facebook::react {

Size AndroidSwitchMeasurementsManager::measure(
    SurfaceId surfaceId,
    LayoutConstraints layoutConstraints) const {
  {
    std::scoped_lock lock(mutex_);
    if (hasBeenMeasured_) {
      return cachedMeasurement_;
    }
  }

  const jni::global_ref<jobject>& fabricUIManager =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");

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
              jfloat)>("measure");

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  local_ref<JString> componentName = make_jstring("AndroidSwitch");

  auto measurement = yogaMeassureToSize(measure(
      fabricUIManager,
      surfaceId,
      componentName.get(),
      nullptr,
      nullptr,
      nullptr,
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height));

  std::scoped_lock lock(mutex_);
  cachedMeasurement_ = measurement;
  return measurement;
}

} // namespace facebook::react
