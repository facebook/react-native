// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <react/bridgeless/ReactInstance.h>

#include <qpljsibindings/QuickPerformanceLoggerJSIBindings.h>
#include <qpljsibindings/UserFlowJSIBindings.h>

namespace facebook {
namespace react {

class BindingsInstaller {
 public:
  ReactInstance::BindingsInstallFunc getBindingsInstallFunc() {
    auto installBindings = [](jsi::Runtime &runtime) {
      jsi::installQPLBindings(runtime);
      jsi::installUserFlowBindings(runtime);
    };
    return installBindings;
  }
};

} // namespace react
} // namespace facebook
