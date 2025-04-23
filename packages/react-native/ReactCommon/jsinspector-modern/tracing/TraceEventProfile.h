/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>

#include <utility>

namespace facebook::react::jsinspector_modern::tracing {

/// Arbitrary data structure, which represents payload of the "ProfileChunk"
/// Trace Event.
struct TraceEventProfileChunk {
  /// Deltas between timestamps of chronolocigally sorted samples.
  /// Will be sent as part of the "ProfileChunk" trace event.
  struct TimeDeltas {
   public:
    explicit TimeDeltas(std::vector<long long> deltas)
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

  /// Contains Profile information that will be emitted in this chunk: nodes and
  /// sample root node ids.
  struct CPUProfile {
    /// Unique node in the profile tree, has unique id, call frame and
    /// optionally
    /// id of its parent node. Only root node has no parent.
    struct Node {
      /// Unique call frame in the call stack.
      struct CallFrame {
       public:
        CallFrame(
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

     public:
      Node(
          uint32_t id,
          CallFrame callFrame,
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
      CallFrame callFrame_;
      std::optional<uint32_t> parentId_;
    };

   public:
    CPUProfile(std::vector<Node> nodes, std::vector<uint32_t> samples)
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
    std::vector<Node> nodes_;
    std::vector<uint32_t> samples_;
  };

 public:
  TraceEventProfileChunk(CPUProfile cpuProfile, TimeDeltas timeDeltas)
      : cpuProfile_(std::move(cpuProfile)),
        timeDeltas_(std::move(timeDeltas)) {}

  folly::dynamic asDynamic() const {
    folly::dynamic value = folly::dynamic::object;
    value["cpuProfile"] = cpuProfile_.asDynamic();
    value["timeDeltas"] = timeDeltas_.asDynamic();

    return value;
  }

 private:
  CPUProfile cpuProfile_;
  TimeDeltas timeDeltas_;
};

} // namespace facebook::react::jsinspector_modern::tracing
