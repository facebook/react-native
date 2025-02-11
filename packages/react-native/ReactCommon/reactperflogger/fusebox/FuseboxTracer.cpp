/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/json.h>
#include <fstream>
#include <mutex>
#include <unordered_map>

#include "FuseboxTracer.h"

namespace facebook::react {

namespace {

/** Process ID for all emitted events. */
const uint64_t PID = 1000;

} // namespace

bool FuseboxTracer::isTracing() {
  std::lock_guard lock(mutex_);
  return tracing_;
}

bool FuseboxTracer::startTracing() {
  std::lock_guard lock(mutex_);
  if (tracing_) {
    return false;
  }
  tracing_ = true;
  return true;
}

bool FuseboxTracer::stopTracing(
    const std::function<void(const folly::dynamic& eventsChunk)>&
        resultCallback) {
  std::lock_guard lock(mutex_);

  if (!tracing_) {
    return false;
  }

  tracing_ = false;
  if (buffer_.empty()) {
    return true;
  }

  auto traceEvents = folly::dynamic::array();

  // Register "Main" process
  traceEvents.push_back(folly::dynamic::object(
      "args", folly::dynamic::object("name", "Main"))("cat", "__metadata")(
      "name", "process_name")("ph", "M")("pid", PID)("tid", 0)("ts", 0));
  // Register "Timings" track
  // NOTE: This is a hack to make the trace viewer show a "Timings" track
  // adjacent to custom tracks in our current build of Chrome DevTools.
  // In future, we should align events exactly.
  traceEvents.push_back(folly::dynamic::object(
      "args", folly::dynamic::object("name", "Timings"))("cat", "__metadata")(
      "name", "thread_name")("ph", "M")("pid", PID)("tid", 1000)("ts", 0));

  auto savedBuffer = std::move(buffer_);
  buffer_.clear();
  std::unordered_map<std::string, uint64_t> trackIdMap;
  uint64_t nextTrack = 1001;

  for (auto& event : savedBuffer) {
    // For events with a custom track name, register track
    if (event.track.length() && !trackIdMap.contains(event.track)) {
      auto trackId = nextTrack++;
      trackIdMap[event.track] = trackId;
      traceEvents.push_back(folly::dynamic::object(
          "args", folly::dynamic::object("name", event.track))(
          "cat", "__metadata")("name", "thread_name")("ph", "M")("pid", PID)(
          "tid", trackId)("ts", 0));
    }

    auto trackId =
        trackIdMap.contains(event.track) ? trackIdMap[event.track] : 1000;

    // Emit "blink.user_timing" trace event
    traceEvents.push_back(folly::dynamic::object(
        "args", folly::dynamic::object())("cat", "blink.user_timing")(
        "dur", (event.end - event.start) * 1000)("name", event.name)("ph", "X")(
        "ts", event.start * 1000)("pid", PID)("tid", trackId));

    if (traceEvents.size() >= 1000) {
      resultCallback(traceEvents);
      traceEvents = folly::dynamic::array();
    }
  }

  if (traceEvents.size() >= 1) {
    resultCallback(traceEvents);
  }
  return true;
}

void FuseboxTracer::addEvent(
    const std::string_view& name,
    uint64_t start,
    uint64_t end,
    const std::optional<std::string_view>& track) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (!tracing_) {
    return;
  }
  buffer_.push_back(BufferEvent{
      start, end, std::string(name), std::string(track.value_or(""))});
}

bool FuseboxTracer::stopTracingAndWriteToFile(const std::string& path) {
  auto file = std::ofstream(path);
  folly::dynamic traceEvents = folly::dynamic::array();
  bool result = stopTracing([&traceEvents](const folly::dynamic& eventsChunk) {
    traceEvents.insert(
        traceEvents.end(), eventsChunk.begin(), eventsChunk.end());
  });
  file << folly::toJson(traceEvents) << std::endl;
  file.close();
  return result;
}

/* static */ FuseboxTracer& FuseboxTracer::getFuseboxTracer() {
  static FuseboxTracer tracer;
  return tracer;
}

} // namespace facebook::react
