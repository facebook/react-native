/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TraceEventSerializer.h"
#include "Timing.h"

#include <react/timing/primitives.h>

namespace facebook::react::jsinspector_modern::tracing {

/* static */ folly::dynamic TraceEventSerializer::serialize(
    TraceEvent&& event) {
  folly::dynamic result = folly::dynamic::object;

  if (event.id.has_value()) {
    std::array<char, 16> buffer{};
    snprintf(buffer.data(), buffer.size(), "0x%x", event.id.value());
    result["id"] = buffer.data();
  }
  result["name"] = std::move(event.name);
  result["cat"] = std::move(event.cat);
  result["ph"] = std::string(1, event.ph);
  result["ts"] = highResTimeStampToTracingClockTimeStamp(event.ts);
  result["pid"] = event.pid;
  result["tid"] = event.tid;
  result["args"] = std::move(event.args);
  if (event.dur.has_value()) {
    result["dur"] = highResDurationToTracingClockDuration(event.dur.value());
  }

  return result;
}

/* static */ folly::dynamic TraceEventSerializer::serializeProfileChunk(
    TraceEventProfileChunk&& profileChunk) {
  return folly::dynamic::object(
      "cpuProfile",
      serializeProfileChunkCPUProfile(std::move(profileChunk.cpuProfile)))(
      "timeDeltas",
      serializeProfileChunkTimeDeltas(std::move(profileChunk.timeDeltas)));
}

/* static */ folly::dynamic
TraceEventSerializer::serializeProfileChunkTimeDeltas(
    TraceEventProfileChunk::TimeDeltas&& deltas) {
  auto value = folly::dynamic::array();
  value.reserve(deltas.size());

  for (auto& delta : deltas) {
    value.push_back(highResDurationToTracingClockDuration(delta));
  }
  return value;
}

/* static */ folly::dynamic
TraceEventSerializer::serializeProfileChunkCPUProfile(
    TraceEventProfileChunk::CPUProfile&& cpuProfile) {
  folly::dynamic dynamicNodes = folly::dynamic::array();
  dynamicNodes.reserve(cpuProfile.nodes.size());
  for (auto& node : cpuProfile.nodes) {
    dynamicNodes.push_back(
        serializeProfileChunkCPUProfileNode(std::move(node)));
  }
  folly::dynamic dynamicSamples = folly::dynamic::array(
      std::make_move_iterator(cpuProfile.samples.begin()),
      std::make_move_iterator(cpuProfile.samples.end()));

  return folly::dynamic::object("nodes", std::move(dynamicNodes))(
      "samples", std::move(dynamicSamples));
}

/* static */ folly::dynamic
TraceEventSerializer::serializeProfileChunkCPUProfileNode(
    TraceEventProfileChunk::CPUProfile::Node&& node) {
  folly::dynamic dynamicNode = folly::dynamic::object();

  dynamicNode["callFrame"] =
      serializeProfileChunkCPUProfileNodeCallFrame(std::move(node.callFrame));
  dynamicNode["id"] = node.id;
  if (node.parentId.has_value()) {
    dynamicNode["parent"] = node.parentId.value();
  }

  return dynamicNode;
}

/* static */ folly::dynamic
TraceEventSerializer::serializeProfileChunkCPUProfileNodeCallFrame(
    TraceEventProfileChunk::CPUProfile::Node::CallFrame&& callFrame) {
  folly::dynamic dynamicCallFrame = folly::dynamic::object();
  dynamicCallFrame["codeType"] = std::move(callFrame.codeType);
  dynamicCallFrame["scriptId"] = callFrame.scriptId;
  dynamicCallFrame["functionName"] = std::move(callFrame.functionName);
  if (callFrame.url.has_value()) {
    dynamicCallFrame["url"] = std::move(callFrame.url.value());
  }
  if (callFrame.lineNumber.has_value()) {
    dynamicCallFrame["lineNumber"] = callFrame.lineNumber.value();
  }
  if (callFrame.columnNumber.has_value()) {
    dynamicCallFrame["columnNumber"] = callFrame.columnNumber.value();
  }

  return dynamicCallFrame;
}

} // namespace facebook::react::jsinspector_modern::tracing
