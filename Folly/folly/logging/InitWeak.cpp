/*
 * Copyright 2004-present Facebook, Inc.
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
#include <folly/CPortability.h>

namespace folly {

// The default implementation for getBaseLoggingConfig().
// By default this returns null, and we will use only the default settings
// applied by initializeLoggerDB().
//
// This is defined in a separate module from initLogging() so that it can be
// placed into a separate library from the main folly logging code when linking
// as a shared library.  This is required to help ensure that any
// getBaseLoggingConfig() provided by the main binary is preferred over this
// symbol.
FOLLY_ATTR_WEAK const char* getBaseLoggingConfig() {
  return nullptr;
}

} // namespace folly
