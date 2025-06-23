/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/** @file ALog.h
 *
 *  Very simple android only logging. Define LOG_TAG to enable the macros.
 */

#pragma once

#ifdef __ANDROID__

#include <android/log.h>

namespace facebook {
namespace alog {

template <typename... ARGS>
inline void
log(int level, const char* tag, const char* msg, ARGS... args) noexcept {
  __android_log_print(level, tag, msg, args...);
}

template <typename... ARGS>
inline void log(int level, const char* tag, const char* msg) noexcept {
  __android_log_write(level, tag, msg);
}

template <typename... ARGS>
inline void logv(const char* tag, const char* msg, ARGS... args) noexcept {
  log(ANDROID_LOG_VERBOSE, tag, msg, args...);
}

template <typename... ARGS>
inline void logd(const char* tag, const char* msg, ARGS... args) noexcept {
  log(ANDROID_LOG_DEBUG, tag, msg, args...);
}

template <typename... ARGS>
inline void logi(const char* tag, const char* msg, ARGS... args) noexcept {
  log(ANDROID_LOG_INFO, tag, msg, args...);
}

template <typename... ARGS>
inline void logw(const char* tag, const char* msg, ARGS... args) noexcept {
  log(ANDROID_LOG_WARN, tag, msg, args...);
}

template <typename... ARGS>
inline void loge(const char* tag, const char* msg, ARGS... args) noexcept {
  log(ANDROID_LOG_ERROR, tag, msg, args...);
}

template <typename... ARGS>
inline void logf(const char* tag, const char* msg, ARGS... args) noexcept {
  log(ANDROID_LOG_FATAL, tag, msg, args...);
}

#ifdef LOG_TAG
#define ALOGV(...) ::facebook::alog::logv(LOG_TAG, __VA_ARGS__)
#define ALOGD(...) ::facebook::alog::logd(LOG_TAG, __VA_ARGS__)
#define ALOGI(...) ::facebook::alog::logi(LOG_TAG, __VA_ARGS__)
#define ALOGW(...) ::facebook::alog::logw(LOG_TAG, __VA_ARGS__)
#define ALOGE(...) ::facebook::alog::loge(LOG_TAG, __VA_ARGS__)
#define ALOGF(...) ::facebook::alog::logf(LOG_TAG, __VA_ARGS__)
#endif

} // namespace alog
} // namespace facebook

#else
#define ALOGV(...) ((void)0)
#define ALOGD(...) ((void)0)
#define ALOGI(...) ((void)0)
#define ALOGW(...) ((void)0)
#define ALOGE(...) ((void)0)
#define ALOGF(...) ((void)0)
#endif
