/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdlib>

#ifdef __ANDROID__
#include <android/log.h>
#endif

#ifdef __ANDROID__
#define VANILLAJNI_LOG_ERROR(tag, format, ...) \
  __android_log_print(ANDROID_LOG_ERROR, tag, format, ##__VA_ARGS__)
#else
#define VANILLAJNI_LOG_ERROR(tag, format, ...)
#endif

#define VANILLAJNI_DIE() std::abort()
