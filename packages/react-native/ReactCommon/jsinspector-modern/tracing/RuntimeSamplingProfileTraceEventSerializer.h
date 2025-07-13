/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "PerformanceTracer.h"
#include "ProfileTreeNode.h"
#include "RuntimeSamplingProfile.h"

#include <react/timing/primitives.h>

namespace facebook::react::jsinspector_modern::tracing {

namespace {

struct NodeIdGenerator {
 public:
  uint32_t getNext() {
    return ++counter_;
  }

 private:
  uint32_t counter_ = 0;
};

} // namespace

/**
 * Serializes RuntimeSamplingProfile into collection of specific Trace Events,
 * which represent Profile information on a timeline.
 */
class RuntimeSamplingProfileTraceEventSerializer {
  struct ProfileChunk {
    ProfileChunk(
        uint16_t chunkSize,
        uint64_t chunkThreadId,
        HighResTimeStamp chunkTimestamp)
        : size(chunkSize), threadId(chunkThreadId), timestamp(chunkTimestamp) {
      samples.reserve(size);
      timeDeltas.reserve(size);
    }

    bool isFull() const {
      return samples.size() == size;
    }

    bool isEmpty() const {
      return samples.empty();
    }

    std::vector<ProfileTreeNode> nodes;
    std::vector<uint32_t> samples;
    std::vector<HighResDuration> timeDeltas;
    uint16_t size;
    uint64_t threadId;
    HighResTimeStamp timestamp;
  };

 public:
  /**
   * \param performanceTracer A reference to PerformanceTracer instance.
   * \param notificationCallback A reference to a callback, which is called
   * when a chunk of trace events is ready to be sent.
   * \param traceEventChunkSize The maximum number of ProfileChunk trace
   * events that can be sent in a single CDP Tracing.dataCollected message.
   * \param profileChunkSize The maximum number of ProfileChunk trace events
   * that can be sent in a single ProfileChunk trace event.
   */
  RuntimeSamplingProfileTraceEventSerializer(
      PerformanceTracer& performanceTracer,
      std::function<void(const folly::dynamic& traceEventsChunk)>
          notificationCallback,
      uint16_t traceEventChunkSize,
      uint16_t profileChunkSize = 10)
      : performanceTracer_(performanceTracer),
        notificationCallback_(std::move(notificationCallback)),
        traceEventChunkSize_(traceEventChunkSize),
        profileChunkSize_(profileChunkSize) {
    traceEventBuffer_ = folly::dynamic::array();
    traceEventBuffer_.reserve(traceEventChunkSize);
  }

  /**
   * \param profile What we will be serializing.
   * \param tracingStartTime A timestamp of when tracing of an Instance started,
   * will be used as a starting reference point of JavaScript samples recording.
   */
  void serializeAndNotify(
      const RuntimeSamplingProfile& profile,
      HighResTimeStamp tracingStartTime);

 private:
  /**
   * Sends a single "Profile" Trace Event via notificationCallback_.
   * \param threadId The id of the thread, where the Profile was collected.
   * \param profileId The id of the Profile.
   * \param profileStartUnixTimestamp The Unix timestamp of the start of the
   * profile.
   */
  void sendProfileTraceEvent(
      uint64_t threadId,
      uint16_t profileId,
      HighResTimeStamp profileStartTimestamp) const;

  /**
   * Encapsulates logic for processing the empty sample, when the VM was idling.
   * \param chunk The profile chunk, which will record this sample.
   * \param idleNodeId The id of the (idle) node.
   * \param samplesTimeDelta Delta between the current sample and the
   * previous one.
   */
  void chunkEmptySample(
      ProfileChunk& chunk,
      uint32_t idleNodeId,
      HighResDuration samplesTimeDelta);

  /**
   * Records ProfileChunk as a "ProfileChunk" Trace Event in traceEventBuffer_.
   * \param chunk The chunk that will be buffered.
   * \param profileId The id of the Profile.
   */
  void bufferProfileChunkTraceEvent(ProfileChunk& chunk, uint16_t profileId);

  /**
   * Encapsulates logic for processing the call stack of the sample.
   * \param callStack The call stack that will be processed.
   * \param chunk The profile chunk, which will buffer the sample with the
   * provided call stack.
   * \param rootNode The (root) node. Will be the parent node of the
   * corresponding profile tree branch.
   * \param idleNodeId Id of the (idle) node. Will be the only node that is used
   * for the corresponding profile tree branch, in case of an empty call stack.
   * \param samplesTimeDelta Delta between the current sample and the previous
   * one.
   * \param nodeIdGenerator NodeIdGenerator instance that will be used for
   * generating unique node ids.
   */
  void processCallStack(
      const std::vector<RuntimeSamplingProfile::SampleCallStackFrame>&
          callStack,
      ProfileChunk& chunk,
      ProfileTreeNode& rootNode,
      uint32_t idleNodeId,
      HighResDuration samplesTimeDelta,
      NodeIdGenerator& nodeIdGenerator);

  /**
   * Sends buffered Trace Events via notificationCallback_ and then clears it.
   */
  void sendBufferedTraceEventsAndClear();

  PerformanceTracer& performanceTracer_;
  const std::function<void(const folly::dynamic& traceEventsChunk)>
      notificationCallback_;
  uint16_t traceEventChunkSize_;
  uint16_t profileChunkSize_;

  folly::dynamic traceEventBuffer_;
};

} // namespace facebook::react::jsinspector_modern::tracing
