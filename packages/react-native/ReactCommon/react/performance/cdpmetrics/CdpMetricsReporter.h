/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <jsi/jsi.h>
#include <react/performance/timeline/PerformanceEntry.h>
#include <react/performance/timeline/PerformanceEntryReporterListeners.h>
#include <react/timing/primitives.h>

namespace facebook::react {

/**
 * [Experimental] Reports CDP interaction events via the
 * "__chromium_devtools_metrics_reporter" runtime binding.
 *
 * This populates the Interaction to Next Paint (INP) live metric in Chrome
 * DevTools and the V2 Perf Monitor. Events are reported immediately and do
 * not require an active CDP Tracing session.
 */
class CdpMetricsReporter : public PerformanceEntryReporterEventTimingListener {
 public:
  explicit CdpMetricsReporter(RuntimeExecutor runtimeExecutor);

  void onEventTimingEntry(const PerformanceEventTiming& entry) override;
  void onLongTaskEntry(const PerformanceLongTaskTiming& entry) override;

 private:
  const RuntimeExecutor runtimeExecutor_{};
};

} // namespace facebook::react
