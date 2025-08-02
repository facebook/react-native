/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "TraceRecordingState.h"

namespace facebook::react::jsinspector_modern::tracing {

class TargetTracingAgent {
 public:
  explicit TargetTracingAgent(TraceRecordingState& state) : state_(state) {
    (void)state_;
  }

  virtual ~TargetTracingAgent() = default;

  virtual void enable() = 0;

  virtual void disable() = 0;

 protected:
  TraceRecordingState& state_;
};

} // namespace facebook::react::jsinspector_modern::tracing
