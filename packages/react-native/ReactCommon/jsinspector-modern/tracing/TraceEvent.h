/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>

namespace facebook::react::jsinspector_modern {

namespace {

/**
 * A trace event to send to the debugger frontend, as defined by the Trace Event
 * Format.
 * https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview?pli=1&tab=t.0#heading=h.yr4qxyxotyw
 */
struct TraceEvent {
  /**
   * Optional. Serialized as a string, usually is hexadecimal number.
   * https://github.com/ChromeDevTools/devtools-frontend/blob/99a9104ae974f8caa63927e356800f6762cdbf25/front_end/models/trace/helpers/Trace.ts#L198-L201
   */
  std::optional<uint32_t> id;

  /** The name of the event, as displayed in the Trace Viewer. */
  std::string name;

  /**
   * A comma separated list of categories for the event, configuring how
   * events are shown in the Trace Viewer UI.
   */
  std::string cat;

  /**
   * The event type. This is a single character which changes depending on the
   * type of event being output. See
   * https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview?pli=1&tab=t.0#heading=h.puwqg050lyuy
   */
  char ph;

  /** The tracing clock timestamp of the event, in microseconds (µs). */
  uint64_t ts;

  /** The process ID for the process that output this event. */
  uint64_t pid;

  /** The thread ID for the process that output this event. */
  uint64_t tid;

  /** Any arguments provided for the event. */
  folly::dynamic args = folly::dynamic::object();

  /**
   * The duration of the event, in microseconds (µs). Only applicable to
   * complete events ("ph": "X").
   */
  std::optional<uint64_t> dur;
};

} // namespace

namespace tracing {

struct CPUSamplesTimeDeltas {
 public:
  explicit CPUSamplesTimeDeltas(std::vector<long long> deltas)
      : deltas_(std::move(deltas)) {}

  folly::dynamic asDynamic() const {
    folly::dynamic value = folly::dynamic::array();
    for (auto delta : deltas_) {
      value.push_back(delta);
    }

    return value;
  }

 private:
  std::vector<long long> deltas_;
};

struct CPUProfileNodeCallFrame {
 public:
  CPUProfileNodeCallFrame(
      std::string codeType,
      uint32_t scriptId,
      std::string functionName,
      std::optional<std::string> url = std::nullopt,
      std::optional<uint32_t> lineNumber = std::nullopt,
      std::optional<uint32_t> columnNumber = std::nullopt)
      : codeType_(std::move(codeType)),
        scriptId_(scriptId),
        functionName_(std::move(functionName)),
        url_(std::move(url)),
        lineNumber_(lineNumber),
        columnNumber_(columnNumber) {}

  folly::dynamic asDynamic() const {
    folly::dynamic dynamicCallFrame = folly::dynamic::object();
    dynamicCallFrame["codeType"] = codeType_;
    dynamicCallFrame["scriptId"] = scriptId_;
    dynamicCallFrame["functionName"] = functionName_;
    if (url_.has_value()) {
      dynamicCallFrame["url"] = url_.value();
    }
    if (lineNumber_.has_value()) {
      dynamicCallFrame["lineNumber"] = lineNumber_.value();
    }
    if (columnNumber_.has_value()) {
      dynamicCallFrame["columnNumber"] = columnNumber_.value();
    }

    return dynamicCallFrame;
  }

 private:
  std::string codeType_;
  uint32_t scriptId_;
  std::string functionName_;
  std::optional<std::string> url_;
  std::optional<uint32_t> lineNumber_;
  std::optional<uint32_t> columnNumber_;
};

struct CPUProfileNode {
 public:
  CPUProfileNode(
      uint32_t id,
      CPUProfileNodeCallFrame callFrame,
      std::optional<uint32_t> parentId = std::nullopt)
      : id_(id), callFrame_(std::move(callFrame)), parentId_(parentId) {}

  folly::dynamic asDynamic() const {
    folly::dynamic dynamicNode = folly::dynamic::object();

    dynamicNode["callFrame"] = callFrame_.asDynamic();
    dynamicNode["id"] = id_;
    if (parentId_.has_value()) {
      dynamicNode["parent"] = parentId_.value();
    }

    return dynamicNode;
  }

 private:
  uint32_t id_;
  CPUProfileNodeCallFrame callFrame_;
  std::optional<uint32_t> parentId_;
};

struct CPUProfile {
 public:
  CPUProfile(std::vector<CPUProfileNode> nodes, std::vector<uint32_t> samples)
      : nodes_(std::move(nodes)), samples_(std::move(samples)) {}

  folly::dynamic asDynamic() const {
    folly::dynamic dynamicNodes = folly::dynamic::array();
    for (const auto& node : nodes_) {
      dynamicNodes.push_back(node.asDynamic());
    }

    folly::dynamic dynamicSamples = folly::dynamic::array();
    for (auto sample : samples_) {
      dynamicSamples.push_back(sample);
    }

    return folly::dynamic::object("nodes", dynamicNodes)(
        "samples", dynamicSamples);
  }

 private:
  std::vector<CPUProfileNode> nodes_;
  std::vector<uint32_t> samples_;
};

} // namespace tracing

} // namespace facebook::react::jsinspector_modern
