/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HermesRuntimeSamplingProfileSerializer.h"

namespace fhsp = facebook::hermes::sampling_profiler;

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
bool shouldIgnoreHermesFrame(fhsp::ProfileSampleCallStackFrame* hermesFrame) {
  if (hermesFrame->getKind() !=
      fhsp::ProfileSampleCallStackFrame::Kind::Suspend) {
    return false;
  }

  auto* suspendFrame =
      static_cast<fhsp::ProfileSampleCallStackSuspendFrame*>(hermesFrame);
  auto suspendFrameKind = suspendFrame->getSuspendFrameKind();
  return suspendFrameKind !=
      fhsp::ProfileSampleCallStackSuspendFrame::SuspendFrameKind::GC;
}

RuntimeSamplingProfile::SampleCallStackFrame convertHermesFrameToTracingFrame(
    fhsp::ProfileSampleCallStackFrame* hermesFrame) {
  switch (hermesFrame->getKind()) {
    case fhsp::ProfileSampleCallStackFrame::Kind::JSFunction: {
      auto* jsFunctionFrame =
          static_cast<fhsp::ProfileSampleCallStackJSFunctionFrame*>(
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
    case fhsp::ProfileSampleCallStackFrame::Kind::NativeFunction: {
      auto* nativeFunctionFrame =
          static_cast<fhsp::ProfileSampleCallStackNativeFunctionFrame*>(
              hermesFrame);

      return RuntimeSamplingProfile::SampleCallStackFrame{
          RuntimeSamplingProfile::SampleCallStackFrame::Kind::NativeFunction,
          FALLBACK_SCRIPT_ID, // JavaScript Runtime defines the implementation
                              // for native function, no script ID to reference.
          nativeFunctionFrame->getFunctionName(),
      };
    }
    case fhsp::ProfileSampleCallStackFrame::Kind::HostFunction: {
      auto* hostFunctionFrame =
          static_cast<fhsp::ProfileSampleCallStackHostFunctionFrame*>(
              hermesFrame);

      return RuntimeSamplingProfile::SampleCallStackFrame{
          RuntimeSamplingProfile::SampleCallStackFrame::Kind::HostFunction,
          FALLBACK_SCRIPT_ID, // JavaScript Runtime defines the implementation
                              // for host function, no script ID to reference.
          hostFunctionFrame->getFunctionName(),
      };
    }
    case fhsp::ProfileSampleCallStackFrame::Kind::Suspend: {
      auto* suspendFrame =
          static_cast<fhsp::ProfileSampleCallStackSuspendFrame*>(hermesFrame);
      auto suspendFrameKind = suspendFrame->getSuspendFrameKind();
      if (suspendFrameKind ==
          fhsp::ProfileSampleCallStackSuspendFrame::SuspendFrameKind::GC) {
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
    const fhsp::ProfileSample& hermesSample) {
  const std::vector<std::unique_ptr<fhsp::ProfileSampleCallStackFrame>>&
      hermesSampleCallStack = hermesSample.getCallStack();

  std::vector<RuntimeSamplingProfile::SampleCallStackFrame>
      reconciledSampleCallStack;
  reconciledSampleCallStack.reserve(hermesSampleCallStack.size());

  for (const auto& hermesFrame : hermesSampleCallStack) {
    if (shouldIgnoreHermesFrame(hermesFrame.get())) {
      continue;
    }

    RuntimeSamplingProfile::SampleCallStackFrame reconciledFrame =
        convertHermesFrameToTracingFrame(hermesFrame.get());
    reconciledSampleCallStack.push_back(std::move(reconciledFrame));
  }

  return RuntimeSamplingProfile::Sample{
      hermesSample.getTimestamp(),
      hermesSample.getThreadId(),
      std::move(reconciledSampleCallStack)};
}

} // namespace

/* static */ RuntimeSamplingProfile
HermesRuntimeSamplingProfileSerializer::serializeToTracingSamplingProfile(
    const fhsp::Profile& hermesProfile) {
  const std::vector<fhsp::ProfileSample>& hermesSamples =
      hermesProfile.getSamples();
  std::vector<RuntimeSamplingProfile::Sample> reconciledSamples;
  reconciledSamples.reserve(hermesSamples.size());

  for (const auto& hermesSample : hermesSamples) {
    RuntimeSamplingProfile::Sample reconciledSample =
        convertHermesSampleToTracingSample(hermesSample);
    reconciledSamples.push_back(std::move(reconciledSample));
  }

  return RuntimeSamplingProfile{"Hermes", std::move(reconciledSamples)};
}

} // namespace facebook::react::jsinspector_modern::tracing
