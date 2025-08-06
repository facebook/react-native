/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeSamplingProfileTraceEventSerializer.h"
#include "PerformanceTracer.h"
#include "ProfileTreeNode.h"
#include "TraceEventSerializer.h"

#include <string_view>

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
      .callFrame = std::move(traceEventCallFrame),
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

struct ProfileChunk {
  ProfileChunk(
      uint16_t chunkSize,
      ProcessId chunkProcessId,
      ThreadId chunkThreadId,
      HighResTimeStamp chunkTimestamp)
      : size(chunkSize),
        processId(chunkProcessId),
        threadId(chunkThreadId),
        timestamp(chunkTimestamp) {
    samples.reserve(size);
    timeDeltas.reserve(size);
  }

  inline bool isFull() const {
    return samples.size() == size;
  }

  inline bool isEmpty() const {
    return samples.empty();
  }

  std::vector<ProfileTreeNode> nodes;
  std::vector<uint32_t> samples;
  std::vector<HighResDuration> timeDeltas;
  uint16_t size;
  ProcessId processId;
  ThreadId threadId;
  HighResTimeStamp timestamp;
};

// Construct and send "Profile" Trace Event with dispatchCallback.
void sendProfileTraceEvent(
    ProcessId processId,
    ThreadId threadId,
    RuntimeProfileId profileId,
    HighResTimeStamp profileStartTimestamp,
    const std::function<void(folly::dynamic&& traceEventsChunk)>&
        dispatchCallback) {
  auto traceEvent = PerformanceTracer::constructRuntimeProfileTraceEvent(
      profileId, processId, threadId, profileStartTimestamp);
  folly::dynamic serializedTraceEvent =
      TraceEventSerializer::serialize(std::move(traceEvent));

  dispatchCallback(folly::dynamic::array(std::move(serializedTraceEvent)));
}

// Add an empty sample to the chunk.
void chunkEmptySample(
    ProfileChunk& chunk,
    uint32_t idleNodeId,
    HighResDuration samplesTimeDelta) {
  chunk.samples.push_back(idleNodeId);
  chunk.timeDeltas.push_back(samplesTimeDelta);
}

// Take the current local ProfileChunk, serialize it as "ProfileChunk" Trace
// Event and buffer it.
void bufferProfileChunkTraceEvent(
    ProfileChunk&& chunk,
    RuntimeProfileId profileId,
    folly::dynamic& traceEventBuffer) {
  std::vector<TraceEventProfileChunk::CPUProfile::Node> traceEventNodes;
  traceEventNodes.reserve(chunk.nodes.size());
  for (const auto& node : chunk.nodes) {
    traceEventNodes.push_back(convertToTraceEventProfileNode(node));
  }

  auto traceEvent = PerformanceTracer::constructRuntimeProfileChunkTraceEvent(
      profileId,
      chunk.processId,
      chunk.threadId,
      chunk.timestamp,
      TraceEventProfileChunk{
          .cpuProfile =
              TraceEventProfileChunk::CPUProfile{
                  .nodes = std::move(traceEventNodes),
                  .samples = std::move(chunk.samples)},
          .timeDeltas = std::move(chunk.timeDeltas),
      });
  auto serializedTraceEvent =
      TraceEventSerializer::serialize(std::move(traceEvent));

  traceEventBuffer.push_back(std::move(serializedTraceEvent));
}

// Process a call stack of a single sample and add it to the chunk.
void processCallStack(
    std::vector<RuntimeSamplingProfile::SampleCallStackFrame>&& callStack,
    ProfileChunk& chunk,
    ProfileTreeNode& rootNode,
    uint32_t idleNodeId,
    HighResDuration samplesTimeDelta,
    IdGenerator& nodeIdGenerator) {
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

// Send buffered Trace Events and reset the buffer.
void sendBufferedTraceEvents(
    folly::dynamic&& traceEventBuffer,
    const std::function<void(folly::dynamic&& traceEventsChunk)>&
        dispatchCallback) {
  dispatchCallback(std::move(traceEventBuffer));
}

} // namespace

/* static */ void
RuntimeSamplingProfileTraceEventSerializer::serializeAndDispatch(
    std::vector<RuntimeSamplingProfile>&& profiles,
    IdGenerator& profileIdGenerator,
    HighResTimeStamp tracingStartTime,
    const std::function<void(folly::dynamic&& traceEventsChunk)>&
        dispatchCallback,
    uint16_t traceEventChunkSize,
    uint16_t profileChunkSize) {
  for (auto&& profile : profiles) {
    serializeAndDispatch(
        std::move(profile),
        profileIdGenerator,
        tracingStartTime,
        dispatchCallback,
        traceEventChunkSize,
        profileChunkSize);
  }
}

/* static */ void
RuntimeSamplingProfileTraceEventSerializer::serializeAndDispatch(
    RuntimeSamplingProfile&& profile,
    IdGenerator& profileIdGenerator,
    HighResTimeStamp tracingStartTime,
    const std::function<void(folly::dynamic&& traceEventsChunk)>&
        dispatchCallback,
    uint16_t traceEventChunkSize,
    uint16_t profileChunkSize) {
  auto samples = std::move(profile.samples);
  if (samples.empty()) {
    return;
  }

  auto traceEventBuffer = folly::dynamic::array();
  traceEventBuffer.reserve(traceEventChunkSize);

  ThreadId threadId = samples.front().threadId;
  HighResTimeStamp previousSampleTimestamp = tracingStartTime;
  HighResTimeStamp currentChunkTimestamp = tracingStartTime;
  auto profileId = profileIdGenerator.getNext();

  sendProfileTraceEvent(
      profile.processId,
      threadId,
      profileId,
      tracingStartTime,
      dispatchCallback);

  // There could be any number of new nodes in this chunk. Empty if all nodes
  // are already emitted in previous chunks.
  ProfileChunk chunk{
      profileChunkSize, profile.processId, threadId, currentChunkTimestamp};

  IdGenerator nodeIdGenerator{};
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
    ThreadId currentSampleThreadId = sample.threadId;
    auto currentSampleTimestamp = getHighResTimeStampForSample(sample);

    // We should not attempt to merge samples from different threads.
    // From past observations, this only happens for GC nodes.
    // We should group samples by thread id once we support executing JavaScript
    // on different threads.
    if (currentSampleThreadId != chunk.threadId || chunk.isFull()) {
      bufferProfileChunkTraceEvent(
          std::move(chunk), profileId, traceEventBuffer);
      chunk = ProfileChunk{
          profileChunkSize,
          profile.processId,
          currentSampleThreadId,
          currentChunkTimestamp};
    }

    if (traceEventBuffer.size() == traceEventChunkSize) {
      sendBufferedTraceEvents(std::move(traceEventBuffer), dispatchCallback);

      traceEventBuffer = folly::dynamic::array();
      traceEventBuffer.reserve(traceEventChunkSize);
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
    bufferProfileChunkTraceEvent(std::move(chunk), profileId, traceEventBuffer);
  }

  if (!traceEventBuffer.empty()) {
    sendBufferedTraceEvents(std::move(traceEventBuffer), dispatchCallback);
  }
}

} // namespace facebook::react::jsinspector_modern::tracing
