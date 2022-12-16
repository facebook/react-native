/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <butter/source_location.h>
#include <react/bridging/Base.h>

namespace facebook::react {

class Error {
 public:
  Error(
      std::string message,
      std::source_location location = std::source_location::current())
      : message_(std::move(message)),
        stack_(
            "\nin " + std::string(location.function_name()) + " at " +
            std::string(location.file_name()) + ":" +
            std::to_string(location.line())) {}

  Error(
      const char *message,
      std::source_location location = std::source_location::current())
      : Error(std::string(message), location) {}

  const std::string &message() const {
    return message_;
  }

  const std::string &stack() const {
    return stack_;
  }

 private:
  std::string message_;
  std::string stack_;
};

template <>
struct Bridging<jsi::JSError> {
  static jsi::JSError fromJs(jsi::Runtime &rt, const jsi::Value &value) {
    return jsi::JSError(rt, jsi::Value(rt, value));
  }

  static jsi::JSError fromJs(jsi::Runtime &rt, jsi::Value &&value) {
    return jsi::JSError(rt, std::move(value));
  }

  static jsi::Value toJs(jsi::Runtime &rt, std::string message) {
    return jsi::Value(rt, jsi::JSError(rt, std::move(message)).value());
  }
};

template <>
struct Bridging<Error> {
  static jsi::Value toJs(jsi::Runtime &rt, const Error &error) {
    return jsi::Value(
        rt, jsi::JSError(rt, error.message(), error.stack()).value());
  }
};

} // namespace facebook::react
