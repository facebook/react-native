/**
 * Copyright 2018-present, Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @file ALog.h
 *
 *  Very simple (android only) logging. Define LOG_TAG to enable the macros.
 */

#pragma once

#ifdef __ANDROID__

#include <android/log.h>

namespace facebook {
namespace jni {
namespace log_ {
// the weird name of this namespace is to avoid a conflict with the
// function named log.

inline void loge(const char* tag, const char* msg) noexcept {
  __android_log_write(ANDROID_LOG_ERROR, tag, msg);
}

template<typename... ARGS>
inline void loge(const char* tag, const char* msg, ARGS... args) noexcept {
  __android_log_print(ANDROID_LOG_ERROR, tag, msg, args...);
}

inline void logf(const char* tag, const char* msg) noexcept {
  __android_log_write(ANDROID_LOG_FATAL, tag, msg);
}

template<typename... ARGS>
inline void logf(const char* tag, const char* msg, ARGS... args) noexcept {
  __android_log_print(ANDROID_LOG_FATAL, tag, msg, args...);
}

template<typename... ARGS>
[[noreturn]]
inline void logassert(const char* tag, const char* msg, ARGS... args) noexcept {
  __android_log_assert(0, tag, msg, args...);
}


#ifdef LOG_TAG
# define FBJNI_LOGE(...) ::facebook::jni::log_::loge(LOG_TAG, __VA_ARGS__)
# define FBJNI_LOGF(...) ::facebook::jni::log_::logf(LOG_TAG, __VA_ARGS__)
# define FBJNI_ASSERT(cond) do { if (!(cond)) ::facebook::jni::log_::logassert(LOG_TAG, "%s", #cond); } while(0)
#else
# define FBJNI_LOGE(...) ::facebook::jni::log_::loge("log", __VA_ARGS__)
# define FBJNI_LOGF(...) ::facebook::jni::log_::logf("log", __VA_ARGS__)
# define FBJNI_ASSERT(cond) do { if (!(cond)) ::facebook::jni::log_::logassert("log", "%s", #cond); } while(0)
#endif

}}}

#else
#include <stdlib.h>

# define FBJNI_LOGE(...) ((void)0)
# define FBJNI_LOGF(...) (abort())
# define FBJNI_ASSERT(cond) ((void)0)
#endif
