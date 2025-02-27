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

uint64_t formatTimePointToUnixTimestamp(
    std::chrono::steady_clock::time_point timestamp) {
  return std::chrono::duration_cast<std::chrono::microseconds>(
             timestamp.time_since_epoch())
      .count();
}

TraceEventProfileChunk::CPUProfile::Node convertToTraceEventProfileNode(
    ProfileTreeNode* node) {
  ProfileTreeNode* nodeParent = node->getParent();
  const RuntimeSamplingProfile::SampleCallStackFrame& callFrame =
      node->getCallFrame();
  auto traceEventCallFrame =
      TraceEventProfileChunk::CPUProfile::Node::CallFrame{
          node->getCodeType() == ProfileTreeNode::CodeType::JavaScript
              ? "JS"
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
      node->getId(),
      traceEventCallFrame,
      nodeParent != nullptr ? std::optional<uint32_t>(nodeParent->getId())
                            : std::nullopt};
}

void emitSingleProfileChunk(
    PerformanceTracer& performanceTracer,
    uint16_t profileId,
    uint64_t threadId,
    uint64_t chunkTimestamp,
    std::vector<ProfileTreeNode*>& nodes,
    std::vector<uint32_t>& samples,
    std::vector<long long>& timeDeltas) {
  std::vector<TraceEventProfileChunk::CPUProfile::Node> traceEventNodes;
  traceEventNodes.reserve(nodes.size());
  for (ProfileTreeNode* node : nodes) {
    traceEventNodes.push_back(convertToTraceEventProfileNode(node));
  }

  performanceTracer.reportRuntimeProfileChunk(
      profileId,
      threadId,
      chunkTimestamp,
      TraceEventProfileChunk{
          TraceEventProfileChunk::CPUProfile{traceEventNodes, samples},
          TraceEventProfileChunk::TimeDeltas{timeDeltas},
      });
}

} // namespace

/* static */ void
RuntimeSamplingProfileTraceEventSerializer::serializeAndBuffer(
    PerformanceTracer& performanceTracer,
    const RuntimeSamplingProfile& profile,
    std::chrono::steady_clock::time_point tracingStartTime,
    uint16_t profileChunkSize) {
  std::vector<RuntimeSamplingProfile::Sample> runtimeSamples =
      profile.getSamples();
  if (runtimeSamples.empty()) {
    return;
  }

  uint64_t chunkThreadId = runtimeSamples.front().getThreadId();
  uint64_t tracingStartUnixTimestamp =
      formatTimePointToUnixTimestamp(tracingStartTime);
  uint16_t profileId = performanceTracer.reportRuntimeProfile(
      chunkThreadId, tracingStartUnixTimestamp);

  uint32_t nodeCount = 0;
  auto* rootNode = new ProfileTreeNode(
      ++nodeCount,
      ProfileTreeNode::CodeType::Other,
      nullptr,
      RuntimeSamplingProfile::SampleCallStackFrame{
          RuntimeSamplingProfile::SampleCallStackFrame::Kind::JSFunction,
          0,
          "(root)"});
  auto* programNode = new ProfileTreeNode(
      ++nodeCount,
      ProfileTreeNode::CodeType::Other,
      rootNode,
      RuntimeSamplingProfile::SampleCallStackFrame{
          RuntimeSamplingProfile::SampleCallStackFrame::Kind::JSFunction,
          0,
          "(program)"});
  auto* idleNode = new ProfileTreeNode(
      ++nodeCount,
      ProfileTreeNode::CodeType::Other,
      rootNode,
      RuntimeSamplingProfile::SampleCallStackFrame{
          RuntimeSamplingProfile::SampleCallStackFrame::Kind::JSFunction,
          0,
          "(idle)"});

  rootNode->addChild(programNode);
  rootNode->addChild(idleNode);

  // Ideally, we should use a timestamp from Runtime Sampling Profiler.
  // We currently use tracingStartTime, which is defined in TracingAgent.
  uint64_t previousSampleTimestamp = tracingStartUnixTimestamp;
  // There could be any number of new nodes in this chunk. Empty if all nodes
  // are already emitted in previous chunks.
  std::vector<ProfileTreeNode*> nodesInThisChunk;
  nodesInThisChunk.push_back(rootNode);
  nodesInThisChunk.push_back(programNode);
  nodesInThisChunk.push_back(idleNode);

  std::vector<uint32_t> samplesInThisChunk;
  samplesInThisChunk.reserve(profileChunkSize);
  std::vector<long long> timeDeltasInThisChunk;
  timeDeltasInThisChunk.reserve(profileChunkSize);

  RuntimeSamplingProfile::SampleCallStackFrame garbageCollectorCallFrame =
      RuntimeSamplingProfile::SampleCallStackFrame{
          RuntimeSamplingProfile::SampleCallStackFrame::Kind::GarbageCollector,
          0,
          "(garbage collector)"};
  uint64_t chunkTimestamp = tracingStartUnixTimestamp;
  for (const RuntimeSamplingProfile::Sample& sample : runtimeSamples) {
    uint64_t sampleThreadId = sample.getThreadId();
    // If next sample was recorded on a different thread, emit the current chunk
    // and continue.
    if (chunkThreadId != sampleThreadId) {
      emitSingleProfileChunk(
          performanceTracer,
          profileId,
          chunkThreadId,
          chunkTimestamp,
          nodesInThisChunk,
          samplesInThisChunk,
          timeDeltasInThisChunk);

      nodesInThisChunk.clear();
      samplesInThisChunk.clear();
      timeDeltasInThisChunk.clear();
    }

    chunkThreadId = sampleThreadId;
    std::vector<RuntimeSamplingProfile::SampleCallStackFrame> callStack =
        sample.getCallStack();
    uint64_t sampleTimestamp = sample.getTimestamp();
    if (samplesInThisChunk.empty()) {
      // New chunk. Reset the timestamp.
      chunkTimestamp = sampleTimestamp;
    }

    long long timeDelta = sampleTimestamp - previousSampleTimestamp;
    timeDeltasInThisChunk.push_back(timeDelta);
    previousSampleTimestamp = sampleTimestamp;

    ProfileTreeNode* previousNode = callStack.empty() ? idleNode : rootNode;
    for (auto it = callStack.rbegin(); it != callStack.rend(); ++it) {
      auto callFrame = *it;
      bool isGarbageCollectorFrame = callFrame.getKind() ==
          RuntimeSamplingProfile::SampleCallStackFrame::Kind::GarbageCollector;
      // We don't need real garbage collector call frame, we change it to
      // what Chrome DevTools expects.
      auto* currentNode = new ProfileTreeNode(
          nodeCount + 1,
          isGarbageCollectorFrame ? ProfileTreeNode::CodeType::Other
                                  : ProfileTreeNode::CodeType::JavaScript,
          previousNode,
          isGarbageCollectorFrame ? garbageCollectorCallFrame : callFrame);

      ProfileTreeNode* alreadyExistingNode =
          previousNode->addChild(currentNode);
      if (alreadyExistingNode != nullptr) {
        previousNode = alreadyExistingNode;
      } else {
        nodesInThisChunk.push_back(currentNode);
        ++nodeCount;

        previousNode = currentNode;
      }
    }
    samplesInThisChunk.push_back(previousNode->getId());

    if (samplesInThisChunk.size() == profileChunkSize) {
      emitSingleProfileChunk(
          performanceTracer,
          profileId,
          chunkThreadId,
          chunkTimestamp,
          nodesInThisChunk,
          samplesInThisChunk,
          timeDeltasInThisChunk);

      nodesInThisChunk.clear();
      samplesInThisChunk.clear();
      timeDeltasInThisChunk.clear();
    }
  }

  if (!samplesInThisChunk.empty()) {
    emitSingleProfileChunk(
        performanceTracer,
        profileId,
        chunkThreadId,
        chunkTimestamp,
        nodesInThisChunk,
        samplesInThisChunk,
        timeDeltasInThisChunk);
  }
}

} // namespace facebook::react::jsinspector_modern::tracing
