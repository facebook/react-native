/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/LayoutPrimitives.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include <react/utils/Telemetry.h>

namespace facebook::react {

/*
 * Represents a reference to a commit from the past.
 * The reference can be safely used to address a particular commit from non-core
 * code.
 */
class TimelineFrame final {
  friend class TimelineSnapshot;

  /*
   * Constructor is private and must be called by `TimelineSnapshot` only.
   */
  TimelineFrame(int index, TelemetryTimePoint timePoint) noexcept;

 public:
  using List = std::vector<TimelineFrame>;

  TimelineFrame() = delete;
  TimelineFrame(const TimelineFrame& timelineFrame) noexcept = default;
  TimelineFrame& operator=(const TimelineFrame& other) noexcept = default;

  int getIndex() const noexcept;
  TelemetryTimePoint getTimePoint() const noexcept;

 private:
  int index_;
  TelemetryTimePoint timePoint_;
};

} // namespace facebook::react
