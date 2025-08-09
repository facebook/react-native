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

constexpr uint16_t MIN_DURATION = 10;
constexpr uint16_t DEFAULT_TTL = 4000;
constexpr uint16_t BAD_EVENT_TTL = 20000;

} // namespace

void PerfMonitorUpdateHandler::handlePerfMetricsUpdate(
    const std::string& message) {
  auto payload = folly::parseJson(message);

  if (payload.isObject()) {
    auto duration = static_cast<uint16_t>(payload["duration"].asInt());

    if (duration < MIN_DURATION) {
      return;
    }

    auto responsivenessScore = getResponsivenessScore(duration);
    auto ttl = responsivenessScore == InteractionResponsivenessScore::Poor
        ? BAD_EVENT_TTL
        : DEFAULT_TTL;

    InteractionPayload newInteraction{
        payload["eventName"].asString(),
        static_cast<uint16_t>(payload["startTime"].asInt()),
        duration,
        responsivenessScore,
        ttl};

    if (shouldOverrideLastInteraction(newInteraction)) {
      lastInteraction_ = newInteraction;
      delegate_.unstable_onPerfMonitorUpdate(
          PerfMonitorUpdateRequest{newInteraction});
    }
  }
}

InteractionResponsivenessScore PerfMonitorUpdateHandler::getResponsivenessScore(
    uint16_t duration) {
  if (duration < 200) {
    return InteractionResponsivenessScore::Good;
  } else if (duration < 500) {
    return InteractionResponsivenessScore::NeedsImprovement;
  } else {
    return InteractionResponsivenessScore::Poor;
  }
}

bool PerfMonitorUpdateHandler::shouldOverrideLastInteraction(
    const InteractionPayload& newInteraction) {
  if (!lastInteraction_) {
    return true;
  }

  // Override if last event has expired
  if (HighResTimeStamp::now().toDOMHighResTimeStamp() >
      lastInteraction_->startTime + lastInteraction_->ttl) {
    return true;
  }

  // Override if same or greater responsiveness score
  if (newInteraction.responsivenessScore >=
      lastInteraction_->responsivenessScore) {
    return true;
  }

  return false;
}

} // namespace facebook::react::jsinspector_modern
