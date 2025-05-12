/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <variant>

#include "HermesRuntimeSamplingProfileSerializer.h"

namespace facebook::react::jsinspector_modern::tracing {

namespace {

namespace fhsp = facebook::hermes::sampling_profiler;

/// Fallback script ID for call frames, when Hermes didn't provide one or when
/// this frame is part of the VM, like native functions, used for parity with
/// Chromium + V8.
const uint32_t FALLBACK_SCRIPT_ID = 0;
/// Garbage collector frame name, used for parity with Chromium + V8.
const std::string GARBAGE_COLLECTOR_FRAME_NAME = "(garbage collector)";

/// Filters out Hermes Suspend frames related to Debugger.
/// Even though Debugger domain is expected to be disabled, Hermes might run
/// Debugger loop while recording sampling profile. We only allow GC frames.
inline bool shouldIgnoreHermesFrame(
    const fhsp::ProfileSampleCallStackSuspendFrame& suspendFrame) {
  return suspendFrame.getSuspendFrameKind() !=
      fhsp::ProfileSampleCallStackSuspendFrame::SuspendFrameKind::GC;
}

RuntimeSamplingProfile::SampleCallStackFrame convertNativeHermesFrame(
    const fhsp::ProfileSampleCallStackNativeFunctionFrame& frame) {
  return RuntimeSamplingProfile::SampleCallStackFrame{
      RuntimeSamplingProfile::SampleCallStackFrame::Kind::NativeFunction,
      FALLBACK_SCRIPT_ID, // JavaScript Runtime defines the implementation
                          // for native function, no script ID to reference.
      frame.getFunctionName(),
  };
}

RuntimeSamplingProfile::SampleCallStackFrame convertHostFunctionHermesFrame(
    const fhsp::ProfileSampleCallStackHostFunctionFrame& frame) {
  return RuntimeSamplingProfile::SampleCallStackFrame{
      RuntimeSamplingProfile::SampleCallStackFrame::Kind::HostFunction,
      FALLBACK_SCRIPT_ID, // JavaScript Runtime defines the implementation
                          // for host function, no script ID to reference.
      frame.getFunctionName(),
  };
}

RuntimeSamplingProfile::SampleCallStackFrame convertSuspendHermesFrame(
    const fhsp::ProfileSampleCallStackSuspendFrame& frame) {
  if (frame.getSuspendFrameKind() ==
      fhsp::ProfileSampleCallStackSuspendFrame::SuspendFrameKind::GC) {
    return RuntimeSamplingProfile::SampleCallStackFrame{
        RuntimeSamplingProfile::SampleCallStackFrame::Kind::GarbageCollector,
        FALLBACK_SCRIPT_ID, // GC frames are part of the VM, no script ID to
                            // reference.
        GARBAGE_COLLECTOR_FRAME_NAME,
    };
  }

  // We should have filtered out Debugger Suspend frames before in
  // shouldFilterOutHermesFrame().
  throw std::logic_error{"Unexpected Suspend frame found in Hermes call stack"};
}

RuntimeSamplingProfile::SampleCallStackFrame convertJSFunctionHermesFrame(
    const fhsp::ProfileSampleCallStackJSFunctionFrame& frame) {
  return RuntimeSamplingProfile::SampleCallStackFrame{
      RuntimeSamplingProfile::SampleCallStackFrame::Kind::JSFunction,
      frame.getScriptId(),
      frame.getFunctionName(),
      frame.hasUrl() ? std::optional<std::string>{frame.getUrl()}
                     : std::nullopt,
      frame.hasFunctionLineNumber()
          ? std::optional<uint32_t>{frame.getFunctionLineNumber() - 1}
          // Hermes VM keeps line numbers as 1-based. Convert
          // to 0-based.
          : std::nullopt,
      frame.hasFunctionColumnNumber()
          ? std::optional<uint32_t>{frame.getFunctionColumnNumber() - 1}
          // Hermes VM keeps column numbers as 1-based. Convert to
          // 0-based.
          : std::nullopt,
  };
}

RuntimeSamplingProfile::Sample convertHermesSampleToTracingSample(
    const fhsp::ProfileSample& hermesSample) {
  uint64_t reconciledTimestamp = hermesSample.getTimestamp();
  const auto callStackRange = hermesSample.getCallStackFramesRange();

  std::vector<RuntimeSamplingProfile::SampleCallStackFrame>
      reconciledSampleCallStack;
  reconciledSampleCallStack.reserve(hermesSample.getCallStackFramesCount());

  for (const auto& hermesFrame : callStackRange) {
    if (std::holds_alternative<fhsp::ProfileSampleCallStackSuspendFrame>(
            hermesFrame)) {
      const auto& suspendFrame =
          std::get<fhsp::ProfileSampleCallStackSuspendFrame>(hermesFrame);
      if (shouldIgnoreHermesFrame(suspendFrame)) {
        continue;
      }

      reconciledSampleCallStack.emplace_back(
          convertSuspendHermesFrame(suspendFrame));
    } else if (std::holds_alternative<
                   fhsp::ProfileSampleCallStackNativeFunctionFrame>(
                   hermesFrame)) {
      const auto& nativeFunctionFrame =
          std::get<fhsp::ProfileSampleCallStackNativeFunctionFrame>(
              hermesFrame);
      reconciledSampleCallStack.emplace_back(
          convertNativeHermesFrame(nativeFunctionFrame));
    } else if (std::holds_alternative<
                   fhsp::ProfileSampleCallStackHostFunctionFrame>(
                   hermesFrame)) {
      const auto& hostFunctionFrame =
          std::get<fhsp::ProfileSampleCallStackHostFunctionFrame>(hermesFrame);
      reconciledSampleCallStack.emplace_back(
          convertHostFunctionHermesFrame(hostFunctionFrame));
    } else if (std::holds_alternative<
                   fhsp::ProfileSampleCallStackJSFunctionFrame>(hermesFrame)) {
      const auto& jsFunctionFrame =
          std::get<fhsp::ProfileSampleCallStackJSFunctionFrame>(hermesFrame);
      reconciledSampleCallStack.emplace_back(
          convertJSFunctionHermesFrame(jsFunctionFrame));
    } else {
      throw std::logic_error{"Unknown Hermes stack frame kind"};
    }
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
  const auto samplesRange = hermesProfile.getSamplesRange();
  std::vector<RuntimeSamplingProfile::Sample> reconciledSamples;
  reconciledSamples.reserve(hermesProfile.getSamplesCount());

  for (const auto& hermesSample : samplesRange) {
    RuntimeSamplingProfile::Sample reconciledSample =
        convertHermesSampleToTracingSample(hermesSample);
    reconciledSamples.push_back(std::move(reconciledSample));
  }

  return RuntimeSamplingProfile{"Hermes", std::move(reconciledSamples)};
}

} // namespace facebook::react::jsinspector_modern::tracing
