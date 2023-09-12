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
    const yoga::Config* config,
    const yoga::Node* node,
    YGLogLevel level,
    void* context,
    const char* format,
    va_list args) {
  const yoga::Config* logConfig =
      config != nullptr ? config : resolveRef(YGConfigGetDefault());

  logConfig->log(const_cast<yoga::Node*>(node), level, context, format, args);
}
} // namespace

void log(YGLogLevel level, void* context, const char* format, ...) noexcept {
  va_list args;
  va_start(args, format);
  vlog(nullptr, nullptr, level, context, format, args);
  va_end(args);
}

void log(
    const yoga::Node* node,
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
    const yoga::Config* config,
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
