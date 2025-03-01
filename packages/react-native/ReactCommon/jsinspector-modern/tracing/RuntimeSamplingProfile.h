/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <string>
#include <utility>
#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

/// Contains relevant information about the sampled runtime from start to
/// finish.
struct RuntimeSamplingProfile {
 public:
  /// Represents a single frame inside the captured sample stack.
  struct SampleCallStackFrame {
    /// Represents type of frame inside of recorded call stack.
    enum class Kind {
      JSFunction, /// JavaScript function frame.
      NativeFunction, /// Native built-in functions, like arrayPrototypeMap.
      HostFunction, /// Native functions, defined by Host, a.k.a. Host
                    /// functions.
      GarbageCollector, /// Garbage collection frame.
    };

   public:
    SampleCallStackFrame(
        const Kind kind,
        const uint32_t scriptId,
        std::string functionName,
        std::optional<std::string> url = std::nullopt,
        const std::optional<uint32_t>& lineNumber = std::nullopt,
        const std::optional<uint32_t>& columnNumber = std::nullopt)
        : kind_(kind),
          scriptId_(scriptId),
          functionName_(std::move(functionName)),
          url_(std::move(url)),
          lineNumber_(lineNumber),
          columnNumber_(columnNumber) {}

    /// \return type of the call stack frame.
    Kind getKind() const {
      return kind_;
    }

    /// \return id of the corresponding script in the VM.
    uint32_t getScriptId() const {
      return scriptId_;
    }

    /// \return name of the function that represents call frame.
    const std::string& getFunctionName() const {
      return functionName_;
    }

    bool hasUrl() const {
      return url_.has_value();
    }

    /// \return source url of the corresponding script in the VM.
    const std::string& getUrl() const {
      return url_.value();
    }

    bool hasLineNumber() const {
      return lineNumber_.has_value();
    }

    /// \return 0-based line number of the corresponding call frame.
    uint32_t getLineNumber() const {
      return lineNumber_.value();
    }

    bool hasColumnNumber() const {
      return columnNumber_.has_value();
    }

    /// \return 0-based column number of the corresponding call frame.
    uint32_t getColumnNumber() const {
      return columnNumber_.value();
    }

    inline bool operator==(const SampleCallStackFrame& rhs) const noexcept {
      return kind_ == rhs.kind_ && scriptId_ == rhs.scriptId_ &&
          functionName_ == rhs.functionName_ && url_ == rhs.url_ &&
          lineNumber_ == rhs.lineNumber_ && columnNumber_ == rhs.columnNumber_;
    }

   private:
    Kind kind_;
    uint32_t scriptId_;
    std::string functionName_;
    std::optional<std::string> url_;
    std::optional<uint32_t> lineNumber_;
    std::optional<uint32_t> columnNumber_;
  };

  /// A pair of a timestamp and a snapshot of the call stack at this point in
  /// time.
  struct Sample {
   public:
    Sample(
        uint64_t timestamp,
        uint64_t threadId,
        std::vector<SampleCallStackFrame> callStack)
        : timestamp_(timestamp),
          threadId_(threadId),
          callStack_(std::move(callStack)) {}

    /// \return serialized unix timestamp in microseconds granularity. The
    /// moment when this sample was recorded.
    uint64_t getTimestamp() const {
      return timestamp_;
    }

    /// \return thread id where sample was recorded.
    uint64_t getThreadId() const {
      return threadId_;
    }

    /// \return a snapshot of the call stack. The first element of the vector is
    /// the lowest frame in the stack.
    const std::vector<SampleCallStackFrame>& getCallStack() const {
      return callStack_;
    }

   private:
    /// When the call stack snapshot was taken (μs).
    uint64_t timestamp_;
    /// Thread id where sample was recorded.
    uint64_t threadId_;
    /// Snapshot of the call stack. The first element of the vector is
    /// the lowest frame in the stack.
    std::vector<SampleCallStackFrame> callStack_;
  };

  RuntimeSamplingProfile(std::string runtimeName, std::vector<Sample> samples)
      : runtimeName_(std::move(runtimeName)), samples_(std::move(samples)) {}

  /// \return name of the JavaScript runtime, where sampling occurred.
  const std::string& getRuntimeName() const {
    return runtimeName_;
  }

  /// \return list of recorded samples, should be chronologically sorted.
  const std::vector<Sample>& getSamples() const {
    return samples_;
  }

 private:
  /// Name of the runtime, where sampling occurred: Hermes, V8, etc.
  std::string runtimeName_;
  /// List of recorded samples, should be chronologically sorted.
  std::vector<Sample> samples_;
};

} // namespace facebook::react::jsinspector_modern::tracing
