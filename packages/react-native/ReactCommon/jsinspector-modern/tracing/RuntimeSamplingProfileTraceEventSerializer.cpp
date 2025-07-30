/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <string_view>

#include "ProfileTreeNode.h"
#include "RuntimeSamplingProfileTraceEventSerializer.h"

namespace facebook::react::jsinspector_modern::tracing {

namespace {

// To capture samples timestamps Hermes is using steady_clock and returns
// them in microseconds granularity since epoch. In the future we might want to
// update Hermes to return timestamps in chrono type.
HighResTimeStamp getHighResTimeStampForSample(
    const RuntimeSamplingProfile::Sample& sample) {
  auto microsecondsSinceSteadyClockEpoch = sample.timestamp;
  auto chronoTimePoint = std::chrono::steady_clock::time_point(
      std::chrono::microseconds(microsecondsSinceSteadyClockEpoch));
  return HighResTimeStamp::fromChronoSteadyClockTimePoint(chronoTimePoint);
}

// Right now we only emit single Profile. We might revisit this decision in the
// future, once we support multiple VMs being sampled at the same time.
constexpr uint16_t PROFILE_ID = 1;

/// Fallback script ID for artificial call frames, such as (root), (idle) or
/// (program). Required for emulating the payload in a format that is expected
/// by Chrome DevTools.
constexpr uint32_t FALLBACK_SCRIPT_ID = 0;

constexpr std::string_view GARBAGE_COLLECTOR_FRAME_NAME = "(garbage collector)";
constexpr std::string_view ROOT_FRAME_NAME = "(root)";
constexpr std::string_view IDLE_FRAME_NAME = "(idle)";
constexpr std::string_view PROGRAM_FRAME_NAME = "(program)";

TraceEventProfileChunk::CPUProfile::Node convertToTraceEventProfileNode(
    const ProfileTreeNode& node) {
  const RuntimeSamplingProfile::SampleCallStackFrame& callFrame =
      node.getCallFrame();
  auto traceEventCallFrame =
      TraceEventProfileChunk::CPUProfile::Node::CallFrame{
          .codeType =
              node.getCodeType() == ProfileTreeNode::CodeType::JavaScript
              ? "JS"
              : "other",
          .scriptId = callFrame.scriptId,
          .functionName = std::string(callFrame.functionName),
          .url = callFrame.scriptURL
              ? std::optional<std::string>(std::string(*callFrame.scriptURL))
              : std::nullopt,
          .lineNumber = callFrame.lineNumber,
          .columnNumber = callFrame.columnNumber,
      };

  return TraceEventProfileChunk::CPUProfile::Node{
      .id = node.getId(),
      .callFrame = traceEventCallFrame,
      .parentId = node.hasParent() ? std::optional<uint32_t>(node.getParentId())
                                   : std::nullopt,
  };
}

RuntimeSamplingProfile::SampleCallStackFrame createArtificialCallFrame(
    std::string_view callFrameName) {
  return RuntimeSamplingProfile::SampleCallStackFrame{
      .kind = RuntimeSamplingProfile::SampleCallStackFrame::Kind::JSFunction,
      .scriptId = FALLBACK_SCRIPT_ID,
      .functionName = callFrameName,
  };
};

RuntimeSamplingProfile::SampleCallStackFrame createGarbageCollectorCallFrame() {
  return RuntimeSamplingProfile::SampleCallStackFrame{
      .kind =
          RuntimeSamplingProfile::SampleCallStackFrame::Kind::GarbageCollector,
      .scriptId = FALLBACK_SCRIPT_ID,
      .functionName = GARBAGE_COLLECTOR_FRAME_NAME,
  };
};

class ProfileTreeRootNode : public ProfileTreeNode {
 public:
  explicit ProfileTreeRootNode(uint32_t id)
      : ProfileTreeNode(
            id,
            CodeType::Other,
            createArtificialCallFrame(ROOT_FRAME_NAME)) {}
};

} // namespace

void RuntimeSamplingProfileTraceEventSerializer::sendProfileTraceEvent(
    uint64_t threadId,
    uint16_t profileId,
    HighResTimeStamp profileStartTimestamp) const {
  folly::dynamic serializedTraceEvent =
      performanceTracer_.getSerializedRuntimeProfileTraceEvent(
          threadId, profileId, profileStartTimestamp);

  notificationCallback_(folly::dynamic::array(serializedTraceEvent));
}

void RuntimeSamplingProfileTraceEventSerializer::chunkEmptySample(
    ProfileChunk& chunk,
    uint32_t idleNodeId,
    HighResDuration samplesTimeDelta) {
  chunk.samples.push_back(idleNodeId);
  chunk.timeDeltas.push_back(samplesTimeDelta);
}

void RuntimeSamplingProfileTraceEventSerializer::bufferProfileChunkTraceEvent(
    ProfileChunk&& chunk,
    uint16_t profileId) {
  if (chunk.isEmpty()) {
    return;
  }

  std::vector<TraceEventProfileChunk::CPUProfile::Node> traceEventNodes;
  traceEventNodes.reserve(chunk.nodes.size());
  for (const auto& node : chunk.nodes) {
    traceEventNodes.push_back(convertToTraceEventProfileNode(node));
  }

  traceEventBuffer_.push_back(
      performanceTracer_.getSerializedRuntimeProfileChunkTraceEvent(
          profileId,
          chunk.threadId,
          chunk.timestamp,
          TraceEventProfileChunk{
              .cpuProfile =
                  TraceEventProfileChunk::CPUProfile{
                      .nodes = std::move(traceEventNodes),
                      .samples = std::move(chunk.samples)},
              .timeDeltas = std::move(chunk.timeDeltas),
          }));
}

void RuntimeSamplingProfileTraceEventSerializer::processCallStack(
    std::vector<RuntimeSamplingProfile::SampleCallStackFrame>&& callStack,
    ProfileChunk& chunk,
    ProfileTreeNode& rootNode,
    uint32_t idleNodeId,
    HighResDuration samplesTimeDelta,
    NodeIdGenerator& nodeIdGenerator) {
  if (callStack.empty()) {
    chunkEmptySample(chunk, idleNodeId, samplesTimeDelta);
    return;
  }

  ProfileTreeNode* previousNode = &rootNode;
  for (auto it = callStack.rbegin(); it != callStack.rend(); ++it) {
    const RuntimeSamplingProfile::SampleCallStackFrame& callFrame = *it;
    bool isGarbageCollectorFrame = callFrame.kind ==
        RuntimeSamplingProfile::SampleCallStackFrame::Kind::GarbageCollector;

    ProfileTreeNode::CodeType childCodeType = isGarbageCollectorFrame
        ? ProfileTreeNode::CodeType::Other
        : ProfileTreeNode::CodeType::JavaScript;
    // We don't need real garbage collector call frame, we change it to
    // what Chrome DevTools expects.
    RuntimeSamplingProfile::SampleCallStackFrame childCallFrame =
        isGarbageCollectorFrame ? createGarbageCollectorCallFrame() : callFrame;

    ProfileTreeNode* maybeExistingChild =
        previousNode->getIfAlreadyExists(childCodeType, childCallFrame);
    if (maybeExistingChild != nullptr) {
      previousNode = maybeExistingChild;
    } else {
      previousNode = previousNode->addChild(
          nodeIdGenerator.getNext(), childCodeType, childCallFrame);
      chunk.nodes.push_back(*previousNode);
    }
  }

  chunk.samples.push_back(previousNode->getId());
  chunk.timeDeltas.push_back(samplesTimeDelta);
}

void RuntimeSamplingProfileTraceEventSerializer::
    sendBufferedTraceEventsAndClear() {
  notificationCallback_(std::move(traceEventBuffer_));

  traceEventBuffer_ = folly::dynamic::array();
  traceEventBuffer_.reserve(traceEventChunkSize_);
}

void RuntimeSamplingProfileTraceEventSerializer::serializeAndNotify(
    RuntimeSamplingProfile&& profile,
    HighResTimeStamp tracingStartTime) {
  auto samples = std::move(profile.samples);
  if (samples.empty()) {
    return;
  }

  uint64_t firstChunkThreadId = samples.front().threadId;
  HighResTimeStamp previousSampleTimestamp = tracingStartTime;
  HighResTimeStamp currentChunkTimestamp = tracingStartTime;

  sendProfileTraceEvent(firstChunkThreadId, PROFILE_ID, tracingStartTime);

  // There could be any number of new nodes in this chunk. Empty if all nodes
  // are already emitted in previous chunks.
  ProfileChunk chunk{
      profileChunkSize_, firstChunkThreadId, currentChunkTimestamp};

  NodeIdGenerator nodeIdGenerator{};

  ProfileTreeRootNode rootNode(nodeIdGenerator.getNext());
  chunk.nodes.push_back(rootNode);

  ProfileTreeNode* programNode = rootNode.addChild(
      nodeIdGenerator.getNext(),
      ProfileTreeNode::CodeType::Other,
      createArtificialCallFrame(PROGRAM_FRAME_NAME));
  chunk.nodes.push_back(*programNode);

  ProfileTreeNode* idleNode = rootNode.addChild(
      nodeIdGenerator.getNext(),
      ProfileTreeNode::CodeType::Other,
      createArtificialCallFrame(IDLE_FRAME_NAME));
  chunk.nodes.push_back(*idleNode);
  uint32_t idleNodeId = idleNode->getId();

  for (auto& sample : samples) {
    uint64_t currentSampleThreadId = sample.threadId;
    auto currentSampleTimestamp = getHighResTimeStampForSample(sample);

    // We should not attempt to merge samples from different threads.
    // From past observations, this only happens for GC nodes.
    // We should group samples by thread id once we support executing JavaScript
    // on different threads.
    if (currentSampleThreadId != chunk.threadId || chunk.isFull()) {
      bufferProfileChunkTraceEvent(std::move(chunk), PROFILE_ID);
      chunk = ProfileChunk{
          profileChunkSize_, currentSampleThreadId, currentChunkTimestamp};
    }

    if (traceEventBuffer_.size() == traceEventChunkSize_) {
      sendBufferedTraceEventsAndClear();
    }

    processCallStack(
        std::move(sample.callStack),
        chunk,
        rootNode,
        idleNodeId,
        currentSampleTimestamp - previousSampleTimestamp,
        nodeIdGenerator);

    previousSampleTimestamp = currentSampleTimestamp;
  }

  if (!chunk.isEmpty()) {
    bufferProfileChunkTraceEvent(std::move(chunk), PROFILE_ID);
  }

  if (!traceEventBuffer_.empty()) {
    sendBufferedTraceEventsAndClear();
  }
}

} // namespace facebook::react::jsinspector_modern::tracing
