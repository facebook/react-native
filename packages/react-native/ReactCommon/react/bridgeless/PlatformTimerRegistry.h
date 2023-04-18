// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include <cstdint>

namespace facebook {
namespace react {

/**
 * This interface is implemented by each platform.
 * Responsibility: Call into some platform API to register/schedule, or delete
 * registered/scheduled timers.
 */
class PlatformTimerRegistry {
 public:
  virtual void createTimer(uint32_t timerID, double delayMS) = 0;

  virtual void deleteTimer(uint32_t timerID) = 0;

  virtual void createRecurringTimer(uint32_t timerID, double delayMS) = 0;

  virtual ~PlatformTimerRegistry() noexcept = default;
};

using TimerManagerDelegate = PlatformTimerRegistry;

} // namespace react
} // namespace facebook
