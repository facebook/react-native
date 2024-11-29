/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/debug/Log.h>

#ifdef ANDROID
#include <android/log.h>
#endif

namespace facebook::yoga {

namespace {

void vlog(
    const yoga::Config* config,
    const yoga::Node* node,
    LogLevel level,
    const char* format,
    va_list args) {
  if (config == nullptr) {
    getDefaultLogger()(nullptr, node, unscopedEnum(level), format, args);
  } else {
    config->log(node, level, format, args);
  }
}
} // namespace

void log(LogLevel level, const char* format, ...) noexcept {
  va_list args;
  va_start(args, format);
  vlog(nullptr, nullptr, level, format, args);
  va_end(args);
}

void log(
    const yoga::Node* node,
    LogLevel level,
    const char* format,
    ...) noexcept {
  va_list args;
  va_start(args, format);
  vlog(
      node == nullptr ? nullptr : node->getConfig(), node, level, format, args);
  va_end(args);
}

void log(
    const yoga::Config* config,
    LogLevel level,
    const char* format,
    ...) noexcept {
  va_list args;
  va_start(args, format);
  vlog(config, nullptr, level, format, args);
  va_end(args);
}

YGLogger getDefaultLogger() {
  return [](const YGConfigConstRef /*config*/,
            const YGNodeConstRef /*node*/,
            YGLogLevel level,
            const char* format,
            va_list args) -> int {
#ifdef ANDROID
    int androidLevel = YGLogLevelDebug;
    switch (level) {
      case YGLogLevelFatal:
        androidLevel = ANDROID_LOG_FATAL;
        break;
      case YGLogLevelError:
        androidLevel = ANDROID_LOG_ERROR;
        break;
      case YGLogLevelWarn:
        androidLevel = ANDROID_LOG_WARN;
        break;
      case YGLogLevelInfo:
        androidLevel = ANDROID_LOG_INFO;
        break;
      case YGLogLevelDebug:
        androidLevel = ANDROID_LOG_DEBUG;
        break;
      case YGLogLevelVerbose:
        androidLevel = ANDROID_LOG_VERBOSE;
        break;
    }
    return __android_log_vprint(androidLevel, "yoga", format, args);
#else
    switch (level) {
      case YGLogLevelError:
      case YGLogLevelFatal:
        return vfprintf(stderr, format, args);
      case YGLogLevelWarn:
      case YGLogLevelInfo:
      case YGLogLevelDebug:
      case YGLogLevelVerbose:
      default:
        return vprintf(format, args);
    }
#endif
  };
}

} // namespace facebook::yoga
