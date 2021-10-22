/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/scheduler/SurfaceHandler.h>

namespace facebook {
namespace react {

class SurfaceHandlerBinding : public jni::HybridClass<SurfaceHandlerBinding> {
 public:
  constexpr static const char *const kJavaDescriptor =
      "Lcom/facebook/react/fabric/SurfaceHandlerBinding;";

  static void registerNatives();

  SurfaceHandlerBinding(SurfaceId surfaceId, std::string const &moduleName);

  void start();
  void stop();

  void setDisplayMode(jint mode);

  void registerScheduler(std::shared_ptr<Scheduler> scheduler);
  void unregisterScheduler(std::shared_ptr<Scheduler> scheduler);

  jint getSurfaceId();
  void setSurfaceId(jint surfaceId);
  jni::local_ref<jstring> getModuleName();

  jboolean isRunning();

  void setLayoutConstraints(
      jfloat minWidth,
      jfloat maxWidth,
      jfloat minHeight,
      jfloat maxHeight,
      jfloat offsetX,
      jfloat offsetY,
      jboolean doLeftAndRightSwapInRTL,
      jboolean isRTL,
      jfloat pixelDensity);

  void setProps(NativeMap *props);

  SurfaceHandler const &getSurfaceHandler();

 private:
  mutable better::shared_mutex lifecycleMutex_;
  const SurfaceHandler surfaceHandler_;

  jni::alias_ref<SurfaceHandlerBinding::jhybriddata> jhybridobject_;

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass>,
      jint surfaceId,
      jni::alias_ref<jstring> moduleName);
};

} // namespace react
} // namespace facebook
