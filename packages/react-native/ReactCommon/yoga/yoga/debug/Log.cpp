/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/debug/Log.h>

namespace facebook::yoga {

namespace {

void vlog(
    yoga::Config* config,
    yoga::Node* node,
    YGLogLevel level,
    void* context,
    const char* format,
    va_list args) {
  yoga::Config* logConfig = config != nullptr
      ? config
      : static_cast<yoga::Config*>(YGConfigGetDefault());
  logConfig->log(node, level, context, format, args);
}
} // namespace

void log(
    yoga::Node* node,
    YGLogLevel level,
    void* context,
    const char* format,
    ...) noexcept {
  va_list args;
  va_start(args, format);
  vlog(
      node == nullptr ? nullptr : node->getConfig(),
      node,
      level,
      context,
      format,
      args);
  va_end(args);
}

void log(
    yoga::Config* config,
    YGLogLevel level,
    void* context,
    const char* format,
    ...) noexcept {
  va_list args;
  va_start(args, format);
  vlog(config, nullptr, level, context, format, args);
  va_end(args);
}

} // namespace facebook::yoga
