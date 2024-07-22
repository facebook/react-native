/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cstdint>
#include <functional>
#include <unordered_map>

namespace facebook::react::jsinspector_modern {

class HostTargetSessionObserver {
 public:
  static HostTargetSessionObserver& getInstance();

  void onHostTargetSessionCreated();
  void onHostTargetSessionDestroyed();

  bool hasActiveSessions();
  std::function<void()> subscribe(std::function<void(bool)> callback);

 private:
  HostTargetSessionObserver() = default;
  HostTargetSessionObserver(const HostTargetSessionObserver&) = delete;
  HostTargetSessionObserver& operator=(const HostTargetSessionObserver&) =
      default;
  ~HostTargetSessionObserver() = default;

  int numberOfActiveSessions_ = 0;
  std::unordered_map<uint32_t, std::function<void(bool)>> subscribers_;
  uint32_t subscriberIndex_ = 0;
};

} // namespace facebook::react::jsinspector_modern
