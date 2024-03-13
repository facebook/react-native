/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>

#include <jsi/jsi.h>

namespace facebook::react::jsinspector_modern {

enum class ConsoleAPIType {
  kLog,
  kDebug,
  kInfo,
  kError,
  kWarning,
  kDir,
  kDirXML,
  kTable,
  kTrace,
  kStartGroup,
  kStartGroupCollapsed,
  kEndGroup,
  kClear,
  kAssert,
  kTimeEnd,
  kCount
};

struct ConsoleMessage {
  double timestamp;
  ConsoleAPIType type;
  std::vector<jsi::Value> args;

  ConsoleMessage(
      double timestamp,
      ConsoleAPIType type,
      std::vector<jsi::Value> args)
      : timestamp(timestamp), type(type), args(std::move(args)) {}

  ConsoleMessage(const ConsoleMessage& other) = delete;
  ConsoleMessage(ConsoleMessage&& other) noexcept = default;
  ConsoleMessage& operator=(const ConsoleMessage& other) = delete;
  ConsoleMessage& operator=(ConsoleMessage&& other) noexcept = default;
  ~ConsoleMessage() = default;
};

} // namespace facebook::react::jsinspector_modern
