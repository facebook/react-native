/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsinspector-modern/tracing/Timing.h>
#include <react/timing/primitives.h>

#include <folly/dynamic.h>

namespace facebook::react::jsinspector_modern::tracing {

/// Arbitrary data structure, which represents payload of the "ProfileChunk"
/// Trace Event.
struct TraceEventProfileChunk {
  /// Deltas between timestamps of chronolocigally sorted samples.
  /// Will be sent as part of the "ProfileChunk" trace event.
  struct TimeDeltas {
    folly::dynamic toDynamic() const {
      auto value = folly::dynamic::array();
      value.reserve(deltas.size());
      for (const auto& delta : deltas) {
        value.push_back(highResDurationToTracingClockDuration(delta));
      }
      return value;
    }

    std::vector<HighResDuration> deltas;
  };

  /// Contains Profile information that will be emitted in this chunk: nodes and
  /// sample root node ids.
  struct CPUProfile {
    /// Unique node in the profile tree, has unique id, call frame and
    /// optionally
    /// id of its parent node. Only root node has no parent.
    struct Node {
      /// Unique call frame in the call stack.
      struct CallFrame {
        folly::dynamic toDynamic() const {
          folly::dynamic dynamicCallFrame = folly::dynamic::object();
          dynamicCallFrame["codeType"] = codeType;
          dynamicCallFrame["scriptId"] = scriptId;
          dynamicCallFrame["functionName"] = functionName;
          if (url.has_value()) {
            dynamicCallFrame["url"] = url.value();
          }
          if (lineNumber.has_value()) {
            dynamicCallFrame["lineNumber"] = lineNumber.value();
          }
          if (columnNumber.has_value()) {
            dynamicCallFrame["columnNumber"] = columnNumber.value();
          }

          return dynamicCallFrame;
        }

        std::string codeType;
        uint32_t scriptId;
        std::string functionName;
        std::optional<std::string> url;
        std::optional<uint32_t> lineNumber;
        std::optional<uint32_t> columnNumber;
      };

      folly::dynamic toDynamic() const {
        folly::dynamic dynamicNode = folly::dynamic::object();

        dynamicNode["callFrame"] = callFrame.toDynamic();
        dynamicNode["id"] = id;
        if (parentId.has_value()) {
          dynamicNode["parent"] = parentId.value();
        }

        return dynamicNode;
      }

      uint32_t id;
      CallFrame callFrame;
      std::optional<uint32_t> parentId;
    };

    folly::dynamic toDynamic() const {
      folly::dynamic dynamicNodes = folly::dynamic::array();
      dynamicNodes.reserve(nodes.size());
      for (const auto& node : nodes) {
        dynamicNodes.push_back(node.toDynamic());
      }
      folly::dynamic dynamicSamples =
          folly::dynamic::array(samples.begin(), samples.end());

      return folly::dynamic::object("nodes", dynamicNodes)(
          "samples", dynamicSamples);
    }

    std::vector<Node> nodes;
    std::vector<uint32_t> samples;
  };

  folly::dynamic toDynamic() const {
    return folly::dynamic::object("cpuProfile", cpuProfile.toDynamic())(
        "timeDeltas", timeDeltas.toDynamic());
  }

  CPUProfile cpuProfile;
  TimeDeltas timeDeltas;
};

} // namespace facebook::react::jsinspector_modern::tracing
