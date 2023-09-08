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
    yoga::log(
        static_cast<yoga::Node*>(nullptr),
        YGLogLevelFatal,
        nullptr,
        "%s\n",
        message);
    fatalWithMessage(message);
  }
}

void assertFatalWithNode(
    const YGNodeConstRef node,
    const bool condition,
    const char* message) {
  if (!condition) {
    yoga::log(
        // TODO: Break log callbacks and make them const correct
        static_cast<yoga::Node*>(const_cast<YGNodeRef>(node)),
        YGLogLevelFatal,
        nullptr,
        "%s\n",
        message);
    fatalWithMessage(message);
  }
}

void assertFatalWithConfig(
    YGConfigRef config,
    const bool condition,
    const char* message) {
  if (!condition) {
    yoga::log(
        static_cast<yoga::Config*>(config),
        YGLogLevelFatal,
        nullptr,
        "%s\n",
        message);
    fatalWithMessage(message);
  }
}

} // namespace facebook::yoga
