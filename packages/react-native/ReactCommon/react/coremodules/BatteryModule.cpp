/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BatteryModule.h"
#include <ReactCommon/TurboModuleUtils.h>
#include <react/bridging/Bridging.h>

#ifdef _WIN32
#include <Windows.h>
#include <winrt/Windows.System.Power.h>
#include <winrt/base.h>
#include <stdexcept>

using namespace winrt;
using namespace winrt::Windows::System::Power;
#endif

namespace facebook::react {

BatteryState BatteryModule::getBatteryStateInternal() {
#ifdef _WIN32
  BatteryState state = {0, false, false};

  try {
    // Get battery report from Windows Power Manager
    auto batteryReport = PowerManager::BatteryReport();
    
    if (batteryReport) {
      auto fullChargeCapacity = batteryReport.FullChargeCapacityInMilliwattHours();
      auto remainingCapacity = batteryReport.RemainingCapacityInMilliwattHours();
      
      // Calculate battery level (0-100)
      if (fullChargeCapacity > 0) {
        state.level = static_cast<int>(
            (remainingCapacity * 100) / fullChargeCapacity
        );
        // Clamp to 0-100
        if (state.level < 0) state.level = 0;
        if (state.level > 100) state.level = 100;
      } else {
        // Fallback: use status to estimate
        auto status = batteryReport.Status();
        if (status == BatteryStatus::Charging || status == BatteryStatus::Idle) {
          state.level = 100; // Assume full when charging/idle
        } else {
          state.level = 50; // Unknown, use 50% as default
        }
      }

      // Determine charging status
      auto status = batteryReport.Status();
      state.isCharging = (status == BatteryStatus::Charging);

      // Check for energy saver (low power mode)
      state.isLowPowerMode = PowerManager::EnergySaverStatus() == 
                             EnergySaverStatus::On;
    } else {
      // No battery available (desktop PC, etc.)
      state.level = 100;
      state.isCharging = true; // Assume AC power
      state.isLowPowerMode = false;
    }
  } catch (const std::exception& e) {
    // Fallback values on error
    state.level = 100;
    state.isCharging = true;
    state.isLowPowerMode = false;
  }

  return state;
#else
  // Non-Windows platforms - return default values
  return {100, true, false};
#endif
}

jsi::Value BatteryModule::getBatteryState(jsi::Runtime &rt) {
  return createPromiseAsJSIValue(
      rt,
      [this](jsi::Runtime &runtime, std::shared_ptr<Promise> promise) {
        try {
          auto state = getBatteryStateInternal();
          promise->resolve(bridging::toJs(runtime, state, jsInvoker_));
        } catch (const std::exception& e) {
          promise->reject(e.what());
        }
      });
}

void BatteryModule::addListener(jsi::Runtime &rt, const std::string &eventName) {
  if (eventName != "batteryStateDidChange") {
    return;
  }

  if (!isObserving_) {
    isObserving_ = true;
    lastKnownState_ = getBatteryStateInternal();

#ifdef _WIN32
    try {
      // Listen for battery status changes
      batteryStatusChangedHandler_ = [this]() {
        auto newState = getBatteryStateInternal();
        
        // Only emit if state actually changed
        if (newState.level != lastKnownState_.level ||
            newState.isCharging != lastKnownState_.isCharging ||
            newState.isLowPowerMode != lastKnownState_.isLowPowerMode) {
          lastKnownState_ = newState;
          emitBatteryStateChange(newState);
        }
      };

      // Listen for energy saver status changes
      energySaverStatusChangedHandler_ = [this]() {
        auto newState = getBatteryStateInternal();
        lastKnownState_ = newState;
        emitBatteryStateChange(newState);
      };

      PowerManager::BatteryStatusChanged([this](auto&&, auto&&) {
        if (batteryStatusChangedHandler_) {
          batteryStatusChangedHandler_();
        }
      });

      PowerManager::EnergySaverStatusChanged([this](auto&&, auto&&) {
        if (energySaverStatusChangedHandler_) {
          energySaverStatusChangedHandler_();
        }
      });

      // Emit initial state
      emitBatteryStateChange(lastKnownState_);
    } catch (const std::exception& e) {
      // If event registration fails, still mark as observing
      isObserving_ = true;
    }
#else
    // Non-Windows: just emit initial state
    emitBatteryStateChange(lastKnownState_);
#endif
  }
}

void BatteryModule::removeListeners(jsi::Runtime &rt, double count) {
  if (count == 0) {
    isObserving_ = false;
#ifdef _WIN32
    batteryStatusChangedHandler_ = nullptr;
    energySaverStatusChangedHandler_ = nullptr;
#endif
  }
}

void BatteryModule::emitBatteryStateChange(BatteryState state) {
  if (!isObserving_) {
    return;
  }

  // Emit event to JavaScript using TurboModule event system
  emitDeviceEvent(
      "batteryStateDidChange",
      [state, jsInvoker = jsInvoker_](jsi::Runtime& rt, std::vector<jsi::Value>& args) {
        args.emplace_back(bridging::toJs(rt, state, jsInvoker));
      });
}

} // namespace facebook::react

