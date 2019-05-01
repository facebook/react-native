/*
 * Copyright 2013-present Facebook, Inc.
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

#include <cstdint>
#include <cstdlib>

namespace folly {
namespace symbolizer {

/**
 * Get the current stack trace into addresses, which has room for at least
 * maxAddresses frames.
 *
 * Returns the number of frames written in the array.
 * Returns -1 on failure.
 *
 * NOT async-signal-safe, but fast.
 */
ssize_t getStackTrace(uintptr_t* addresses, size_t maxAddresses);

/**
 * Get the current stack trace into addresses, which has room for at least
 * maxAddresses frames.
 *
 * Returns the number of frames written in the array.
 * Returns -1 on failure.
 *
 * Async-signal-safe, but likely slower.
 */
ssize_t getStackTraceSafe(uintptr_t* addresses, size_t maxAddresses);
} // namespace symbolizer
} // namespace folly
