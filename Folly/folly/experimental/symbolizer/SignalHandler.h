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

#include <functional>

namespace folly {
namespace symbolizer {

/**
 * Install handler for fatal signals. The list of signals being handled is in
 * SignalHandler.cpp.
 *
 * The handler will dump signal and time information followed by a stack trace
 * to stderr, and then call the callbacks registered below.
 */
void installFatalSignalHandler();

/**
 * Add a callback to be run when receiving a fatal signal. They will also
 * be called by LOG(FATAL) and abort() (as those raise SIGABRT internally).
 *
 * These callbacks must be async-signal-safe, so don't even think of using
 * LOG(...) or printf or malloc / new or doing anything even remotely fun.
 *
 * All these fatal callback must be added before calling
 * installFatalSignalCallbacks(), below.
 */
typedef void (*SignalCallback)();
void addFatalSignalCallback(SignalCallback callback);

/**
 * Install the fatal signal callbacks; fatal signals will call these
 * callbacks in the order in which they were added.
 */
void installFatalSignalCallbacks();
} // namespace symbolizer
} // namespace folly
