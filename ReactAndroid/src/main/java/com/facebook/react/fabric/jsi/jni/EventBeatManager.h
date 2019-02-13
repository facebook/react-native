// Copyright 2004-present Facebook. All Rights Reserved.
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <react/events/EventBeat.h>
#include <fb/fbjni.h>
#include <jsi/jsi.h>
#include <mutex>
#include <unordered_set>

using namespace facebook::jsi;

namespace facebook {
namespace react {

class Instance;

class EventBeatManager : public jni::HybridClass<EventBeatManager> {
public:
  constexpr static const char *const kJavaDescriptor =
    "Lcom/facebook/react/fabric/jsi/EventBeatManager;";

  static void registerNatives();

  void registerEventBeat(EventBeat *eventBeat) const;

  void unregisterEventBeat(EventBeat *eventBeat) const;

  void beat();

  EventBeatManager(Runtime* runtime, jni::alias_ref<EventBeatManager::jhybriddata> jhybridobject);

private:

  Runtime* runtime_;

  jni::alias_ref<EventBeatManager::jhybriddata> jhybridobject_;

  mutable std::unordered_set<const EventBeat *> registeredEventBeats_ {}; // Protected by `mutex_`

  mutable std::mutex mutex_;

  static jni::local_ref<EventBeatManager::jhybriddata> initHybrid(jni::alias_ref<EventBeatManager::jhybriddata> jhybridobject, jlong jsContext);

};

}
}
