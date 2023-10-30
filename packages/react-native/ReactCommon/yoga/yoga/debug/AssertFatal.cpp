/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <stdexcept>

#include <yoga/debug/AssertFatal.h>
#include <yoga/debug/Log.h>

namespace facebook::yoga {

[[noreturn]] void fatalWithMessage(const char* message) {
#if defined(__cpp_exceptions)
  throw std::logic_error(message);
#else
  std::terminate();
#endif
}

void assertFatal(const bool condition, const char* message) {
  if (!condition) {
    yoga::log(LogLevel::Fatal, "%s\n", message);
    fatalWithMessage(message);
  }
}

void assertFatalWithNode(
    const yoga::Node* const node,
    const bool condition,
    const char* message) {
  if (!condition) {
    yoga::log(node, LogLevel::Fatal, "%s\n", message);
    fatalWithMessage(message);
  }
}

void assertFatalWithConfig(
    const yoga::Config* const config,
    const bool condition,
    const char* message) {
  if (!condition) {
    yoga::log(config, LogLevel::Fatal, "%s\n", message);
    fatalWithMessage(message);
  }
}

} // namespace facebook::yoga
