/*
 * Copyright 2014-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <folly/io/async/test/TimeUtil.h>
#include <folly/portability/GTest.h>
#include <folly/test/TestUtils.h>

/**
 * Check how long a timeout took to fire.
 *
 * This method verifies:
 * - that the timeout did not fire too early (never less than expectedMS)
 * - that the timeout fired within a reasonable period of the expected
 *   duration.  It must fire within the specified tolerance, excluding time
 *   that this process spent waiting to be scheduled.
 *
 * @param start                 A TimePoint object set just before the timeout
 *                              was scheduled.
 * @param end                   A TimePoint object set when the timeout fired.
 * @param expectedMS            The timeout duration, in milliseconds
 * @param tolerance             The tolerance, in milliseconds.
 */
#define T_CHECK_TIMEOUT(start, end, expectedMS, ...)             \
  if (!::folly::checkTimeout(                                    \
          (start), (end), (expectedMS), false, ##__VA_ARGS__)) { \
    SKIP() << "T_CHECK_TIMEOUT lapsed";                          \
  }

/**
 * Verify that an event took less than a specified amount of time.
 *
 * This is similar to T_CHECK_TIMEOUT, but does not fail if the event took less
 * than the allowed time.
 */
#define T_CHECK_TIME_LT(start, end, expectedMS, ...)            \
  if (!::folly::checkTimeout(                                   \
          (start), (end), (expectedMS), true, ##__VA_ARGS__)) { \
    SKIP() << "T_CHECK_TIMEOUT_LT lapsed";                      \
  }
