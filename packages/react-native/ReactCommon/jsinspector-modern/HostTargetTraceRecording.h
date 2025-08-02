/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "HostAgent.h"
#include "HostTarget.h"
#include "InstanceTarget.h"

#include <jsinspector-modern/tracing/TraceRecordingState.h>

namespace facebook::react::jsinspector_modern {

class HostTargetTraceRecording {
 public:
  explicit HostTargetTraceRecording(HostTarget& hostTarget);

  void setTracedInstance(InstanceTarget* instanceTarget);

  void enable();

  void disable();

  tracing::TraceRecordingState extractState();

 private:
  tracing::TraceRecordingState state_;

  std::shared_ptr<HostTracingAgent> hostTracingAgent_;
};

} // namespace facebook::react::jsinspector_modern
