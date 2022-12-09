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

#include "NativePerformanceObserver.h"

namespace facebook::react {
class PerformanceEntryReporter;

#pragma mark - Structs

#pragma mark - implementation

class NativePerformance : public NativePerformanceCxxSpec<NativePerformance>,
                          std::enable_shared_from_this<NativePerformance> {
 public:
  NativePerformance(std::shared_ptr<CallInvoker> jsInvoker);

  void
  mark(jsi::Runtime &rt, std::string name, double startTime, double duration);
  void clearMarks(jsi::Runtime &rt, std::optional<std::string> markName);

  void measure(
      jsi::Runtime &rt,
      std::string name,
      double startTime,
      double endTime,
      std::optional<double> duration,
      std::optional<std::string> startMark,
      std::optional<std::string> endMark);
  void clearMeasures(jsi::Runtime &rt, std::optional<std::string> measureName);

 private:
};

} // namespace facebook::react
