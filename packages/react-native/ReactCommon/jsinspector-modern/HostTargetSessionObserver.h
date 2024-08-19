/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <functional>
#include <map>
#include <mutex>

namespace facebook::react::jsinspector_modern {

class HostTargetSessionObserver {
 public:
  static HostTargetSessionObserver& getInstance();

  /*
   * Not copyable.
   */
  HostTargetSessionObserver(const HostTargetSessionObserver&) = delete;
  HostTargetSessionObserver& operator=(const HostTargetSessionObserver&) =
      delete;

  /*
   * Not movable.
   */
  HostTargetSessionObserver(HostTargetSessionObserver&&) = delete;
  HostTargetSessionObserver& operator=(HostTargetSessionObserver&&) = delete;

  void onHostTargetSessionCreated();
  void onHostTargetSessionDestroyed();

  bool hasActiveSessions();
  std::function<void()> subscribe(std::function<void(bool)> callback);

 private:
  HostTargetSessionObserver() = default;
  ~HostTargetSessionObserver() = default;

  int activeSessionCount_ = 0;
  std::map<uint32_t, std::function<void(bool)>> subscribers_;
  uint32_t subscriberIndex_ = 0;

  std::mutex mutex_;
};

} // namespace facebook::react::jsinspector_modern
