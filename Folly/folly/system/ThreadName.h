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

#include <string>
#include <thread>

#include <folly/Optional.h>
#include <folly/Range.h>
#include <folly/portability/Config.h>
#include <folly/portability/PThread.h>

namespace folly {

/**
 * This returns true if the current platform supports setting the name of the
 * current thread.
 */
bool canSetCurrentThreadName();

/**
 * This returns true if the current platform supports setting the name of
 * threads other than the one currently executing.
 */
bool canSetOtherThreadName();

/**
 * Get the name of the given thread, or nothing if an error occurs
 * or the functionality is not available.
 */
Optional<std::string> getThreadName(std::thread::id tid);

/**
 * Equivalent to getThreadName(std::this_thread::get_id());
 */
Optional<std::string> getCurrentThreadName();

/**
 * Set the name of the given thread.
 * Returns false on failure, if an error occurs or the functionality
 * is not available.
 */
bool setThreadName(std::thread::id tid, StringPiece name);
bool setThreadName(pthread_t pid, StringPiece name);

/**
 * Equivalent to setThreadName(std::this_thread::get_id(), name);
 */
bool setThreadName(StringPiece name);
} // namespace folly
