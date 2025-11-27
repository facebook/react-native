/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <memory>
#include <string>

namespace facebook::react {

using BatteryState = NativeBatteryBatteryState<int, bool, bool>;

template <>
struct Bridging<BatteryState> : NativeBatteryBatteryStateBridging<BatteryState> {};

class BatteryModule : public NativeBatteryCxxSpec<BatteryModule> {
 public:
  explicit BatteryModule(std::shared_ptr<CallInvoker> jsInvoker) 
      : NativeBatteryCxxSpec(jsInvoker), 
        isObserving_(false),
        lastKnownState_({100, true, false}) {}

  jsi::Value getBatteryState(jsi::Runtime &rt);
  void addListener(jsi::Runtime &rt, const std::string &eventName);
  void removeListeners(jsi::Runtime &rt, double count);

 private:
  BatteryState getBatteryStateInternal();
  void emitBatteryStateChange(BatteryState state);
  
  bool isObserving_;
  BatteryState lastKnownState_;
  
  // Windows event handlers
  std::function<void()> batteryStatusChangedHandler_;
  std::function<void()> energySaverStatusChangedHandler_;
};

} // namespace facebook::react

