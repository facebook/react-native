// Copyright 2004-present Facebook. All Rights Reserved.
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include "ComponentFactoryDelegate.h"
#include "EventBeatManager.h"
#include <memory>
#include <fb/fbjni.h>
#include <react/jni/JMessageQueueThread.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/uimanager/Scheduler.h>
#include <react/uimanager/SchedulerDelegate.h>
#include <mutex>

namespace facebook {
namespace react {

class Instance;

class Binding : public jni::HybridClass<Binding>, public SchedulerDelegate {
public:
  constexpr static const char *const kJavaDescriptor =
    "Lcom/facebook/react/fabric/jsi/Binding;";

  static void registerNatives();

  jni::global_ref<jobject> javaUIManager_;

  std::shared_ptr<Scheduler> scheduler_;

  float pointScaleFactor_ = 1;

private:

  void setConstraints(jint rootTag, jfloat minWidth, jfloat maxWidth, jfloat minHeight, jfloat maxHeight);

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);

  void installFabricUIManager(jlong jsContextNativePointer, jni::alias_ref<jobject> javaUIManager, EventBeatManager* eventBeatManager, jni::alias_ref<JavaMessageQueueThread::javaobject> jsMessageQueueThread, ComponentFactoryDelegate* componentsRegistry, jni::alias_ref<jobject> reactNativeConfig);

  void startSurface(jint surfaceId, NativeMap *initialProps);

  void renderTemplateToSurface(jint surfaceId, jstring uiTemplate);

  void stopSurface(jint surfaceId);

  void schedulerDidFinishTransaction(const Tag rootTag, const ShadowViewMutationList &mutations, const long commitStartTime, const long layoutTime);

  void schedulerDidRequestPreliminaryViewAllocation(const SurfaceId surfaceId, const ComponentName componentName, bool isLayoutable, const ComponentHandle componentHandle);

  void setPixelDensity(float pointScaleFactor);

  void uninstallFabricUIManager();

};

}
}
