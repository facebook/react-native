/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HermesRuntimeSamplingProfileSerializer.h"

namespace facebook::react::jsinspector_modern::tracing {

namespace {

/// Filters out Hermes Suspend frames related to Debugger.
/// Even though Debugger domain is expected to be disabled, Hermes might run
/// Debugger loop while recording sampling profile. We only allow GC frames.
bool shouldIgnoreHermesFrame(
    hermes::sampling_profiler::ProfileSampleCallStackFrame* hermesFrame) {
  if (hermesFrame->getKind() !=
      hermes::sampling_profiler::ProfileSampleCallStackFrame::Kind::Suspend) {
    return false;
  }

  auto* suspendFrame = static_cast<
      hermes::sampling_profiler::ProfileSampleCallStackSuspendFrame*>(
      hermesFrame);
  auto suspendFrameKind = suspendFrame->getSuspendFrameKind();
  return suspendFrameKind !=
      hermes::sampling_profiler::ProfileSampleCallStackSuspendFrame::
          SuspendFrameKind::GC;
}

RuntimeSamplingProfile::SampleCallStackFrame convertHermesFrameToTracingFrame(
    hermes::sampling_profiler::ProfileSampleCallStackFrame* hermesFrame) {
  switch (hermesFrame->getKind()) {
    case hermes::sampling_profiler::ProfileSampleCallStackFrame::Kind::
        JSFunction: {
      auto* jsFunctionFrame = static_cast<
          hermes::sampling_profiler::ProfileSampleCallStackJSFunctionFrame*>(
          hermesFrame);
      return RuntimeSamplingProfile::SampleCallStackFrame{
          RuntimeSamplingProfile::SampleCallStackFrame::Kind::JSFunction,
          jsFunctionFrame->hasScriptId()
              ? jsFunctionFrame->getScriptId()
              : 0, // Use 0 as a fallback for script ID.
          jsFunctionFrame->getFunctionName(),
          jsFunctionFrame->hasUrl()
              ? std::optional<std::string>{jsFunctionFrame->getUrl()}
              : std::nullopt,
          jsFunctionFrame->hasLineNumber()
              ? std::optional<uint32_t>{jsFunctionFrame->getLineNumber() - 1}
              // Hermes VM keeps line numbers as 1-based. Convert to
              // 0-based.
              : std::nullopt,
          jsFunctionFrame->hasColumnNumber()
              ? std::optional<uint32_t>{jsFunctionFrame->getColumnNumber() - 1}
              // Hermes VM keeps column numbers as 1-based. Convert to
              // 0-based.
              : std::nullopt,
      };
    }
    case hermes::sampling_profiler::ProfileSampleCallStackFrame::Kind::
        NativeFunction: {
      auto* nativeFunctionFrame =
          static_cast<hermes::sampling_profiler::
                          ProfileSampleCallStackNativeFunctionFrame*>(
              hermesFrame);

      return RuntimeSamplingProfile::SampleCallStackFrame{
          RuntimeSamplingProfile::SampleCallStackFrame::Kind::NativeFunction,
          0, // JavaScript Runtime defines the implementation for native
             // function, no script ID to reference.
          nativeFunctionFrame->getFunctionName(),
      };
    }
    case hermes::sampling_profiler::ProfileSampleCallStackFrame::Kind::
        HostFunction: {
      auto* hostFunctionFrame = static_cast<
          hermes::sampling_profiler::ProfileSampleCallStackHostFunctionFrame*>(
          hermesFrame);

      return RuntimeSamplingProfile::SampleCallStackFrame{
          RuntimeSamplingProfile::SampleCallStackFrame::Kind::HostFunction,
          0, // JavaScript Runtime defines the implementation for host function,
             // no script ID to reference.
          hostFunctionFrame->getFunctionName(),
      };
    }
    case hermes::sampling_profiler::ProfileSampleCallStackFrame::Kind::
        Suspend: {
      auto* suspendFrame = static_cast<
          hermes::sampling_profiler::ProfileSampleCallStackSuspendFrame*>(
          hermesFrame);
      auto suspendFrameKind = suspendFrame->getSuspendFrameKind();
      if (suspendFrameKind ==
          hermes::sampling_profiler::ProfileSampleCallStackSuspendFrame::
              SuspendFrameKind::GC) {
        return RuntimeSamplingProfile::SampleCallStackFrame{
            RuntimeSamplingProfile::SampleCallStackFrame::Kind::
                GarbageCollector,
            0, // GC frames are part of the VM, no script ID to reference.
            "(garbage collector)",
        };
      }

      // We should have filtered out Debugger Suspend frames before in
      // shouldFilterOutHermesFrame().
      throw std::logic_error{
          "Unexpected Suspend frame found in Hermes call stack"};
    }

    default:
      throw std::logic_error{"Unknown Hermes stack frame kind"};
  }
}

RuntimeSamplingProfile::Sample convertHermesSampleToTracingSample(
    hermes::sampling_profiler::ProfileSample& hermesSample) {
  uint64_t reconciledTimestamp = hermesSample.getTimestamp();
  std::vector<hermes::sampling_profiler::ProfileSampleCallStackFrame*>
      hermesSampleCallStack = hermesSample.getCallStack();

  std::vector<RuntimeSamplingProfile::SampleCallStackFrame>
      reconciledSampleCallStack;
  reconciledSampleCallStack.reserve(hermesSampleCallStack.size());

  for (auto* hermesFrame : hermesSampleCallStack) {
    if (shouldIgnoreHermesFrame(hermesFrame)) {
      continue;
    }
    RuntimeSamplingProfile::SampleCallStackFrame reconciledFrame =
        convertHermesFrameToTracingFrame(hermesFrame);
    reconciledSampleCallStack.push_back(std::move(reconciledFrame));
  }

  return RuntimeSamplingProfile::Sample{
      reconciledTimestamp, std::move(reconciledSampleCallStack)};
}

} // namespace

/* static */ RuntimeSamplingProfile
HermesRuntimeSamplingProfileSerializer::serializeToTracingSamplingProfile(
    const hermes::sampling_profiler::Profile& hermesProfile) {
  const hermes::sampling_profiler::Process& hermesProcess =
      hermesProfile.getProcess();
  const hermes::sampling_profiler::Thread& hermesThread =
      hermesProfile.getThread();
  std::vector<hermes::sampling_profiler::ProfileSample> hermesSamples =
      hermesProfile.getSamples();

  RuntimeSamplingProfile::Process reconciledProcess{hermesProcess.getId()};
  RuntimeSamplingProfile::Thread reconciledThread{
      hermesThread.getId(), hermesThread.getName()};
  std::vector<RuntimeSamplingProfile::Sample> reconciledSamples;
  reconciledSamples.reserve(hermesSamples.size());

  for (auto& hermesSample : hermesSamples) {
    RuntimeSamplingProfile::Sample reconciledSample =
        convertHermesSampleToTracingSample(hermesSample);
    reconciledSamples.push_back(std::move(reconciledSample));
  }

  return RuntimeSamplingProfile{
      "Hermes",
      reconciledProcess,
      std::move(reconciledThread),
      std::move(reconciledSamples)};
}

} // namespace facebook::react::jsinspector_modern::tracing
