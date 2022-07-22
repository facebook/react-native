/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RCTJSIExecutorRuntimeInstaller.h"

#import <React/RCTLog.h>
#include <chrono>

namespace facebook {
namespace react {

JSIExecutor::RuntimeInstaller RCTJSIExecutorRuntimeInstaller(JSIExecutor::RuntimeInstaller runtimeInstallerToWrap)
{
  return [runtimeInstaller = runtimeInstallerToWrap](jsi::Runtime &runtime) {
    Logger iosLoggingBinder = [](const std::string &message, unsigned int logLevel) {
      _RCTLogJavaScriptInternal(static_cast<RCTLogLevel>(logLevel), [NSString stringWithUTF8String:message.c_str()]);
    };
    bindNativeLogger(runtime, iosLoggingBinder);

    PerformanceNow iosPerformanceNowBinder = []() {
      auto time = std::chrono::steady_clock::now();
      auto duration = std::chrono::duration_cast<std::chrono::nanoseconds>(time.time_since_epoch()).count();

      constexpr double NANOSECONDS_IN_MILLISECOND = 1000000.0;

      return duration / NANOSECONDS_IN_MILLISECOND;
    };
    bindNativePerformanceNow(runtime, iosPerformanceNowBinder);

    // Wrap over the original runtimeInstaller
    if (runtimeInstaller) {
      runtimeInstaller(runtime);
    }
  };
}

} // namespace react
} // namespace facebook
