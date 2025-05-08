/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeSamplingProfileTraceEventSerializer.h"
#include "ProfileTreeNode.h"

namespace facebook::react::jsinspector_modern::tracing {

namespace {

// Right now we only emit single Profile. We might revisit this decision in the
// future, once we support multiple VMs being sampled at the same time.
constexpr uint16_t PROFILE_ID = 1;

/// Fallback script ID for artificial call frames, such as (root), (idle) or
/// (program). Required for emulating the payload in a format that is expected
/// by Chrome DevTools.
constexpr uint32_t FALLBACK_SCRIPT_ID = 0;

uint64_t formatTimePointToUnixTimestamp(
    std::chrono::steady_clock::time_point timestamp) {
  return std::chrono::duration_cast<std::chrono::microseconds>(
             timestamp.time_since_epoch())
      .count();
}

TraceEventProfileChunk::CPUProfile::Node convertToTraceEventProfileNode(
    const ProfileTreeNode& node) {
  const RuntimeSamplingProfile::SampleCallStackFrame& callFrame =
      node.getCallFrame();
  auto traceEventCallFrame =
      TraceEventProfileChunk::CPUProfile::Node::CallFrame{
          node.getCodeType() == ProfileTreeNode::CodeType::JavaScript ? "JS"
                                                                      : "other",
          callFrame.getScriptId(),
          callFrame.getFunctionName(),
          callFrame.hasUrl() ? std::optional<std::string>(callFrame.getUrl())
                             : std::nullopt,
          callFrame.hasLineNumber()
              ? std::optional<uint32_t>(callFrame.getLineNumber())
              : std::nullopt,
          callFrame.hasColumnNumber()
              ? std::optional<uint32_t>(callFrame.getColumnNumber())
              : std::nullopt};

  return TraceEventProfileChunk::CPUProfile::Node{
      node.getId(),
      traceEventCallFrame,
      node.hasParent() ? std::optional<uint32_t>(node.getParentId())
                       : std::nullopt};
}

RuntimeSamplingProfile::SampleCallStackFrame createArtificialCallFrame(
    std::string callFrameName) {
  return RuntimeSamplingProfile::SampleCallStackFrame{
      RuntimeSamplingProfile::SampleCallStackFrame::Kind::JSFunction,
      FALLBACK_SCRIPT_ID,
      std::move(callFrameName)};
};

RuntimeSamplingProfile::SampleCallStackFrame createGarbageCollectorCallFrame() {
  return RuntimeSamplingProfile::SampleCallStackFrame{
      RuntimeSamplingProfile::SampleCallStackFrame::Kind::GarbageCollector,
      FALLBACK_SCRIPT_ID,
      "(garbage collector)"};
};

class ProfileTreeRootNode : public ProfileTreeNode {
 public:
  explicit ProfileTreeRootNode(uint32_t id)
      : ProfileTreeNode(
            id,
            CodeType::Other,
            createArtificialCallFrame("(root)")) {}
};

} // namespace

void RuntimeSamplingProfileTraceEventSerializer::sendProfileTraceEvent(
    uint64_t threadId,
    uint16_t profileId,
    uint64_t profileStartUnixTimestamp) const {
  folly::dynamic serializedTraceEvent =
      performanceTracer_.getSerializedRuntimeProfileTraceEvent(
          threadId, profileId, profileStartUnixTimestamp);

  notificationCallback_(folly::dynamic::array(serializedTraceEvent));
}

void RuntimeSamplingProfileTraceEventSerializer::chunkEmptySample(
    ProfileChunk& chunk,
    uint32_t idleNodeId,
    long long samplesTimeDelta) {
  chunk.samples.push_back(idleNodeId);
  chunk.timeDeltas.push_back(samplesTimeDelta);
}

void RuntimeSamplingProfileTraceEventSerializer::bufferProfileChunkTraceEvent(
    ProfileChunk& chunk,
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
                      traceEventNodes, chunk.samples},
              .timeDeltas =
                  TraceEventProfileChunk::TimeDeltas{chunk.timeDeltas},
          }));
}

void RuntimeSamplingProfileTraceEventSerializer::processCallStack(
    const std::vector<RuntimeSamplingProfile::SampleCallStackFrame>& callStack,
    ProfileChunk& chunk,
    ProfileTreeNode& rootNode,
    uint32_t idleNodeId,
    long long samplesTimeDelta,
    NodeIdGenerator& nodeIdGenerator) {
  if (callStack.empty()) {
    chunkEmptySample(chunk, idleNodeId, samplesTimeDelta);
    return;
  }

  ProfileTreeNode* previousNode = &rootNode;
  for (auto it = callStack.rbegin(); it != callStack.rend(); ++it) {
    const RuntimeSamplingProfile::SampleCallStackFrame& callFrame = *it;
    bool isGarbageCollectorFrame = callFrame.getKind() ==
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
  notificationCallback_(traceEventBuffer_);
  traceEventBuffer_ = folly::dynamic::array();
}

void RuntimeSamplingProfileTraceEventSerializer::serializeAndNotify(
    const RuntimeSamplingProfile& profile,
    std::chrono::steady_clock::time_point tracingStartTime) {
  const std::vector<RuntimeSamplingProfile::Sample>& samples =
      profile.getSamples();
  if (samples.empty()) {
    return;
  }

  uint64_t firstChunkThreadId = samples.front().getThreadId();
  uint64_t tracingStartUnixTimestamp =
      formatTimePointToUnixTimestamp(tracingStartTime);
  uint64_t previousSampleUnixTimestamp = tracingStartUnixTimestamp;
  uint64_t currentChunkUnixTimestamp = tracingStartUnixTimestamp;

  sendProfileTraceEvent(
      firstChunkThreadId, PROFILE_ID, tracingStartUnixTimestamp);

  // There could be any number of new nodes in this chunk. Empty if all nodes
  // are already emitted in previous chunks.
  ProfileChunk chunk{
      profileChunkSize_, firstChunkThreadId, currentChunkUnixTimestamp};

  NodeIdGenerator nodeIdGenerator{};

  ProfileTreeRootNode rootNode(nodeIdGenerator.getNext());
  chunk.nodes.push_back(rootNode);

  ProfileTreeNode* programNode = rootNode.addChild(
      nodeIdGenerator.getNext(),
      ProfileTreeNode::CodeType::Other,
      createArtificialCallFrame("(program)"));
  chunk.nodes.push_back(*programNode);

  ProfileTreeNode* idleNode = rootNode.addChild(
      nodeIdGenerator.getNext(),
      ProfileTreeNode::CodeType::Other,
      createArtificialCallFrame("(idle)"));
  chunk.nodes.push_back(*idleNode);
  uint32_t idleNodeId = idleNode->getId();

  for (const auto& sample : samples) {
    uint64_t currentSampleThreadId = sample.getThreadId();
    long long currentSampleUnixTimestamp = sample.getTimestamp();

    // We should not attempt to merge samples from different threads.
    // From past observations, this only happens for GC nodes.
    // We should group samples by thread id once we support executing JavaScript
    // on different threads.
    if (currentSampleThreadId != chunk.threadId || chunk.isFull()) {
      bufferProfileChunkTraceEvent(chunk, PROFILE_ID);
      chunk = ProfileChunk{
          profileChunkSize_, currentSampleThreadId, currentChunkUnixTimestamp};
    }

    if (traceEventBuffer_.size() == traceEventChunkSize_) {
      sendBufferedTraceEventsAndClear();
    }

    processCallStack(
        sample.getCallStack(),
        chunk,
        rootNode,
        idleNodeId,
        currentSampleUnixTimestamp - previousSampleUnixTimestamp,
        nodeIdGenerator);

    previousSampleUnixTimestamp = currentSampleUnixTimestamp;
  }

  if (!chunk.isEmpty()) {
    bufferProfileChunkTraceEvent(chunk, PROFILE_ID);
  }

  if (!traceEventBuffer_.empty()) {
    sendBufferedTraceEventsAndClear();
  }
}

} // namespace facebook::react::jsinspector_modern::tracing
