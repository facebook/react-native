/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerfMonitorV2.h"
#include "HostTarget.h"

#include <folly/json.h>
#include <react/timing/primitives.h>

namespace facebook::react::jsinspector_modern {

namespace {

constexpr uint16_t MIN_DURATION = 200;
constexpr uint16_t DEFAULT_TTL = 4000;
constexpr uint16_t BAD_EVENT_TTL = 20000;

InteractionResponsivenessScore getInteractionScore(uint16_t duration) {
  constexpr uint16_t GOOD_THRESHOLD = 200;
  constexpr uint16_t NEEDS_IMPROVEMENT_THRESHOLD = 500;

  if (duration < GOOD_THRESHOLD) {
    return InteractionResponsivenessScore::Good;
  } else if (duration < NEEDS_IMPROVEMENT_THRESHOLD) {
    return InteractionResponsivenessScore::NeedsImprovement;
  } else {
    return InteractionResponsivenessScore::Poor;
  }
}

} // namespace

void PerfMonitorUpdateHandler::handlePerfMetricsUpdate(
    const std::string& message) {
  auto payload = folly::parseJson(message);

  if (payload.isObject()) {
    if (payload["name"] != "__ReactNative__LongTask") {
      return;
    }

    auto duration = static_cast<uint16_t>(payload["duration"].asInt());

    if (duration < MIN_DURATION) {
      return;
    }

    auto responsivenessScore = getInteractionScore(duration);
    auto ttl = responsivenessScore == InteractionResponsivenessScore::Poor
        ? BAD_EVENT_TTL
        : DEFAULT_TTL;

    LongTaskPayload newEvent{
        static_cast<uint16_t>(payload["startTime"].asInt()),
        duration,
        responsivenessScore,
        ttl};

    if (shouldOverrideLastEvent(newEvent)) {
      lastEvent_ = newEvent;
      delegate_.unstable_onPerfMonitorUpdate(
          PerfMonitorUpdateRequest{newEvent});
    }
  }
}

bool PerfMonitorUpdateHandler::shouldOverrideLastEvent(
    const LongTaskPayload& newEvent) {
  if (!lastEvent_) {
    return true;
  }

  // Override if last event has expired
  if (HighResTimeStamp::now().toDOMHighResTimeStamp() >
      lastEvent_->startTime + lastEvent_->ttl) {
    return true;
  }

  // Override if same or greater responsiveness score
  if (newEvent.responsivenessScore >= lastEvent_->responsivenessScore) {
    return true;
  }

  return false;
}

} // namespace facebook::react::jsinspector_modern
