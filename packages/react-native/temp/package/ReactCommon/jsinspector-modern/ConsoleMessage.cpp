/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ConsoleMessage.h"

#include <chrono>
#include <utility>

namespace facebook::react::jsinspector_modern {

SimpleConsoleMessage::SimpleConsoleMessage(
    double timestamp,
    ConsoleAPIType type,
    std::vector<std::string> args)
    : timestamp(timestamp), type(type), args(std::move(args)) {}

SimpleConsoleMessage::SimpleConsoleMessage(
    ConsoleAPIType type,
    std::vector<std::string> args)
    : timestamp(
          std::chrono::duration_cast<std::chrono::duration<double, std::milli>>(
              std::chrono::system_clock::now().time_since_epoch())
              .count()),
      type(type),
      args(std::move(args)) {}

ConsoleMessage::ConsoleMessage(
    jsi::Runtime& runtime,
    SimpleConsoleMessage message)
    : timestamp(message.timestamp), type(message.type) {
  for (auto& arg : message.args) {
    args.emplace_back(jsi::String::createFromUtf8(runtime, arg));
  }
}

} // namespace facebook::react::jsinspector_modern
