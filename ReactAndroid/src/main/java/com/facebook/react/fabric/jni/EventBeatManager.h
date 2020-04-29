<<<<<<< HEAD
// Copyright 2004-present Facebook. All Rights Reserved.
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <fb/fbjni.h>
#include <jsi/jsi.h>
#include <react/core/EventBeat.h>
#include <react/utils/RuntimeExecutor.h>
#include <mutex>
#include <unordered_set>

using namespace facebook::jsi;
=======
/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <mutex>
#include <unordered_set>

#include <fbjni/fbjni.h>
#include <react/core/EventBeat.h>
#include <react/utils/RuntimeExecutor.h>
>>>>>>> fb/0.62-stable

namespace facebook {
namespace react {

<<<<<<< HEAD
class Instance;

class EventBeatManager : public jni::HybridClass<EventBeatManager> {
 public:
  constexpr static const char* const kJavaDescriptor =
=======
class EventBeatManagerObserver {
 public:
  /*
   * Called by `EventBeatManager` on the main thread signaling that this is a
   * good time to flush an event queue.
   */
  virtual void tick() const = 0;

  virtual ~EventBeatManagerObserver() noexcept = default;
};

class EventBeatManager : public jni::HybridClass<EventBeatManager> {
 public:
  constexpr static const char *const kJavaDescriptor =
>>>>>>> fb/0.62-stable
      "Lcom/facebook/react/fabric/events/EventBeatManager;";

  static void registerNatives();

<<<<<<< HEAD
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
=======
  EventBeatManager(jni::alias_ref<EventBeatManager::jhybriddata> jhybridobject);

  /*
   * Adds (or removes) observers.
   * `EventBeatManager` does not own/retain observers; observers must overlive
   * the manager or be properly removed before deallocation.
   */
  void addObserver(EventBeatManagerObserver const &observer) const;
  void removeObserver(EventBeatManagerObserver const &observer) const;

 private:
  /*
   * Called by Java counterpart at the end of every run loop tick.
   */
  void tick();

  jni::alias_ref<EventBeatManager::jhybriddata> jhybridobject_;

  mutable std::unordered_set<EventBeatManagerObserver const *>
      observers_{}; // Protected by `mutex_`
>>>>>>> fb/0.62-stable

  mutable std::mutex mutex_;

  static jni::local_ref<EventBeatManager::jhybriddata> initHybrid(
      jni::alias_ref<EventBeatManager::jhybriddata> jhybridobject);
};

} // namespace react
} // namespace facebook
