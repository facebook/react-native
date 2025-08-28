/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TraceRecordingStateSerializer.h"
#include "RuntimeSamplingProfileTraceEventSerializer.h"
#include "TraceEventSerializer.h"

namespace facebook::react::jsinspector_modern::tracing {

namespace {

folly::dynamic generateNewChunk(uint16_t chunkSize) {
  folly::dynamic chunk = folly::dynamic::array();
  chunk.reserve(chunkSize);

  return chunk;
}

} // namespace

/* static */ void TraceRecordingStateSerializer::emitAsDataCollectedChunks(
    TraceRecordingState&& recording,
    const std::function<void(folly::dynamic&&)>& chunkCallback,
    uint16_t performanceTraceEventsChunkSize,
    uint16_t profileTraceEventsChunkSize) {
  auto instancesProfiles = std::move(recording.instanceTracingProfiles);
  IdGenerator profileIdGenerator;

  for (auto& instanceProfile : instancesProfiles) {
    emitPerformanceTraceEvents(
        std::move(instanceProfile.performanceTraceEvents),
        chunkCallback,
        performanceTraceEventsChunkSize);
  }

  RuntimeSamplingProfileTraceEventSerializer::serializeAndDispatch(
      std::move(recording.runtimeSamplingProfiles),
      profileIdGenerator,
      recording.startTime,
      chunkCallback,
      profileTraceEventsChunkSize);
}

/* static */ void TraceRecordingStateSerializer::emitPerformanceTraceEvents(
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

} // namespace facebook::react::jsinspector_modern::tracing
