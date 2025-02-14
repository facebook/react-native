/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HermesRuntimeSamplingProfileSerializer.h"

namespace facebook::react::jsinspector_modern::tracing {

namespace {

/// Fallback script ID for call frames, when Hermes didn't provide one or when
/// this frame is part of the VM, like native functions, used for parity with
/// Chromium + V8.
const uint32_t FALLBACK_SCRIPT_ID = 0;
/// Garbage collector frame name, used for parity with Chromium + V8.
const std::string GARBAGE_COLLECTOR_FRAME_NAME = "(garbage collector)";

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
          jsFunctionFrame->hasScriptId() ? jsFunctionFrame->getScriptId()
                                         : FALLBACK_SCRIPT_ID,
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
          FALLBACK_SCRIPT_ID, // JavaScript Runtime defines the implementation
                              // for native function, no script ID to reference.
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
          FALLBACK_SCRIPT_ID, // JavaScript Runtime defines the implementation
                              // for host function, no script ID to reference.
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
            FALLBACK_SCRIPT_ID, // GC frames are part of the VM, no script ID to
                                // reference.
            GARBAGE_COLLECTOR_FRAME_NAME,
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
      reconciledTimestamp,
      hermesSample.getThreadId(),
      std::move(reconciledSampleCallStack)};
}

} // namespace

/* static */ RuntimeSamplingProfile
HermesRuntimeSamplingProfileSerializer::serializeToTracingSamplingProfile(
    const hermes::sampling_profiler::Profile& hermesProfile) {
  std::vector<hermes::sampling_profiler::ProfileSample> hermesSamples =
      hermesProfile.getSamples();
  std::vector<RuntimeSamplingProfile::Sample> reconciledSamples;
  reconciledSamples.reserve(hermesSamples.size());

  for (auto& hermesSample : hermesSamples) {
    RuntimeSamplingProfile::Sample reconciledSample =
        convertHermesSampleToTracingSample(hermesSample);
    reconciledSamples.push_back(std::move(reconciledSample));
  }

  return RuntimeSamplingProfile{"Hermes", std::move(reconciledSamples)};
}

} // namespace facebook::react::jsinspector_modern::tracing
