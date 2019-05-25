// Copyright 2004-present Facebook. All Rights Reserved.
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <fb/fbjni.h>
#include <jsi/jsi.h>
#include <react/core/EventBeat.h>
#include <react/uimanager/primitives.h>
#include <mutex>
#include <unordered_set>

using namespace facebook::jsi;

namespace facebook {
namespace react {

class Instance;

class EventBeatManager : public jni::HybridClass<EventBeatManager> {
 public:
  constexpr static const char* const kJavaDescriptor =
      "Lcom/facebook/react/fabric/events/EventBeatManager;";

  static void registerNatives();

  void setRuntimeExecutor(RuntimeExecutor runtimeExecutor);

  void registerEventBeat(EventBeat* eventBeat) const;

  void unregisterEventBeat(EventBeat* eventBeat) const;

  void beat();

  EventBeatManager(jni::alias_ref<EventBeatManager::jhybriddata> jhybridobject);

 private:
  RuntimeExecutor runtimeExecutor_;

  jni::alias_ref<EventBeatManager::jhybriddata> jhybridobject_;

  mutable std::unordered_set<const EventBeat*>
      registeredEventBeats_{}; // Protected by `mutex_`

  mutable std::mutex mutex_;

  static jni::local_ref<EventBeatManager::jhybriddata> initHybrid(
      jni::alias_ref<EventBeatManager::jhybriddata> jhybridobject);
};

} // namespace react
} // namespace facebook
