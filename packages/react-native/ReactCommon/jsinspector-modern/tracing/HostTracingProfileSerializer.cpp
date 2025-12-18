/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostTracingProfileSerializer.h"
#include "RuntimeSamplingProfileTraceEventSerializer.h"
#include "TraceEventGenerator.h"
#include "TraceEventSerializer.h"

namespace facebook::react::jsinspector_modern::tracing {

namespace {

folly::dynamic generateNewChunk(uint16_t chunkSize) {
  folly::dynamic chunk = folly::dynamic::array();
  chunk.reserve(chunkSize);

  return chunk;
}

/**
 * Hardcoded layer tree ID for all recorded frames.
 * https://chromedevtools.github.io/devtools-protocol/tot/LayerTree/
 */
constexpr int FALLBACK_LAYER_TREE_ID = 1;

} // namespace

/* static */ void HostTracingProfileSerializer::emitAsDataCollectedChunks(
    HostTracingProfile&& hostTracingProfile,
    const std::function<void(folly::dynamic&&)>& chunkCallback,
    uint16_t traceEventsChunkSize,
    uint16_t profileTraceEventsChunkSize) {
  emitFrameTimings(
      std::move(hostTracingProfile.frameTimings),
      hostTracingProfile.processId,
      hostTracingProfile.startTime,
      chunkCallback,
      traceEventsChunkSize);

  auto instancesProfiles =
      std::move(hostTracingProfile.instanceTracingProfiles);
  IdGenerator profileIdGenerator;

  for (auto& instanceProfile : instancesProfiles) {
    emitPerformanceTraceEvents(
        std::move(instanceProfile.performanceTraceEvents),
        chunkCallback,
        traceEventsChunkSize);
  }

  RuntimeSamplingProfileTraceEventSerializer::serializeAndDispatch(
      std::move(hostTracingProfile.runtimeSamplingProfiles),
      profileIdGenerator,
      hostTracingProfile.startTime,
      chunkCallback,
      profileTraceEventsChunkSize);
}

/* static */ void HostTracingProfileSerializer::emitPerformanceTraceEvents(
    std::vector<TraceEvent>&& events,
    const std::function<void(folly::dynamic&&)>& chunkCallback,
    uint16_t chunkSize) {
  folly::dynamic chunk = generateNewChunk(chunkSize);

  for (auto& event : events) {
    if (chunk.size() == chunkSize) {
      chunkCallback(std::move(chunk));
      chunk = generateNewChunk(chunkSize);
    }

    chunk.push_back(TraceEventSerializer::serialize(std::move(event)));
  }

  if (!chunk.empty()) {
    chunkCallback(std::move(chunk));
  }
}

/* static */ void HostTracingProfileSerializer::emitFrameTimings(
    std::vector<FrameTimingSequence>&& frameTimings,
    ProcessId processId,
    HighResTimeStamp recordingStartTimestamp,
    const std::function<void(folly::dynamic&& chunk)>& chunkCallback,
    uint16_t chunkSize) {
  if (frameTimings.empty()) {
    return;
  }

  folly::dynamic chunk = generateNewChunk(chunkSize);
  auto setLayerTreeIdEvent = TraceEventGenerator::createSetLayerTreeIdEvent(
      "", // Hardcoded frame name for the default (and only) layer.
      FALLBACK_LAYER_TREE_ID,
      processId,
      frameTimings.front().threadId,
      recordingStartTimestamp);
  chunk.push_back(
      TraceEventSerializer::serialize(std::move(setLayerTreeIdEvent)));

  for (auto&& frameTimingSequence : frameTimings) {
    if (chunk.size() >= chunkSize) {
      chunkCallback(std::move(chunk));
      chunk = generateNewChunk(chunkSize);
    }

    auto [beginDrawingEvent, commitEvent, endDrawingEvent] =
        TraceEventGenerator::createFrameTimingsEvents(
            frameTimingSequence.id,
            FALLBACK_LAYER_TREE_ID,
            frameTimingSequence.beginDrawingTimestamp,
            frameTimingSequence.commitTimestamp,
            frameTimingSequence.endDrawingTimestamp,
            processId,
            frameTimingSequence.threadId);

    chunk.push_back(
        TraceEventSerializer::serialize(std::move(beginDrawingEvent)));
    chunk.push_back(TraceEventSerializer::serialize(std::move(commitEvent)));
    chunk.push_back(
        TraceEventSerializer::serialize(std::move(endDrawingEvent)));

    if (frameTimingSequence.screenshot.has_value()) {
      auto screenshotEvent = TraceEventGenerator::createScreenshotEvent(
          frameTimingSequence.id,
          FALLBACK_LAYER_TREE_ID,
          std::move(frameTimingSequence.screenshot.value()),
          frameTimingSequence.endDrawingTimestamp,
          processId,
          frameTimingSequence.threadId);

      chunk.push_back(
          TraceEventSerializer::serialize(std::move(screenshotEvent)));
    }
  }

  if (!chunk.empty()) {
    chunkCallback(std::move(chunk));
  }
}

} // namespace facebook::react::jsinspector_modern::tracing
