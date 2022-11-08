/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Bridging.h>
#include <optional>
#include <string>

namespace facebook::react {

struct RawPerformanceEntry {
  std::string name;
  int32_t entryType;
  double startTime;
  double duration;
  // For "event" entries only:
  std::optional<double> processingStart;
  std::optional<double> processingEnd;
  std::optional<double> interactionId;
};

template <>
struct Bridging<RawPerformanceEntry> {
  static RawPerformanceEntry fromJs(
      jsi::Runtime &rt,
      const jsi::Object &value,
      const std::shared_ptr<CallInvoker> &jsInvoker) {
    RawPerformanceEntry result{
        bridging::fromJs<std::string>(
            rt, value.getProperty(rt, "name"), jsInvoker),
        bridging::fromJs<int32_t>(
            rt, value.getProperty(rt, "entryType"), jsInvoker),
        bridging::fromJs<double>(
            rt, value.getProperty(rt, "startTime"), jsInvoker),
        bridging::fromJs<double>(
            rt, value.getProperty(rt, "duration"), jsInvoker),
        bridging::fromJs<std::optional<double>>(
            rt, value.getProperty(rt, "processingStart"), jsInvoker),
        bridging::fromJs<std::optional<double>>(
            rt, value.getProperty(rt, "processingEnd"), jsInvoker),
        bridging::fromJs<std::optional<double>>(
            rt, value.getProperty(rt, "interactionId"), jsInvoker),
    };
    return result;
  }

  static jsi::Object toJs(jsi::Runtime &rt, const RawPerformanceEntry &value) {
    auto result = facebook::jsi::Object(rt);
    result.setProperty(rt, "name", bridging::toJs(rt, value.name));
    result.setProperty(rt, "entryType", bridging::toJs(rt, value.entryType));
    result.setProperty(rt, "startTime", bridging::toJs(rt, value.startTime));
    result.setProperty(rt, "duration", bridging::toJs(rt, value.duration));
    if (value.processingStart) {
      result.setProperty(
          rt,
          "processingStart",
          bridging::toJs(rt, value.processingStart.value()));
    }
    if (value.processingEnd) {
      result.setProperty(
          rt, "processingEnd", bridging::toJs(rt, value.processingEnd.value()));
    }
    if (value.interactionId) {
      result.setProperty(
          rt, "interactionId", bridging::toJs(rt, value.interactionId.value()));
    }
    return result;
  }
};

} // namespace facebook::react
