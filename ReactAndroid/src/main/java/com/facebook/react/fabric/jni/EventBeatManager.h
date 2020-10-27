/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <mutex>
#include <unordered_set>

#include <ReactCommon/RuntimeExecutor.h>
#include <fbjni/fbjni.h>
#include <react/renderer/core/EventBeat.h>

namespace facebook {
namespace react {

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
      "Lcom/facebook/react/fabric/events/EventBeatManager;";

  static void registerNatives();

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

  mutable std::mutex mutex_;

  static jni::local_ref<EventBeatManager::jhybriddata> initHybrid(
      jni::alias_ref<EventBeatManager::jhybriddata> jhybridobject);
};

} // namespace react
} // namespace facebook
