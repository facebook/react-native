// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <fb/fbjni.h>
#include <jni.h>
#include <react/bridgeless/TimerManager.h>
#include <react/jni/WritableNativeArray.h>

namespace facebook {
namespace react {

class JJSTimerExecutor : public jni::HybridClass<JJSTimerExecutor> {
 public:
  JJSTimerExecutor() = default;

  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/venice/JSTimerExecutor;";

  static void registerNatives();

  void setTimerManager(std::weak_ptr<TimerManager> timerManager);

  void callTimers(WritableNativeArray *timerIDs);

 private:
  friend HybridBase;

  std::weak_ptr<TimerManager> timerManager_;
};

} // namespace react
} // namespace facebook
