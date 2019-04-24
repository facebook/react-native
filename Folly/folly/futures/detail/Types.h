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

#include <chrono>

namespace folly {

/// folly::Duration is an alias for the best resolution we offer/work with.
/// However, it is not intended to be used for client code - you should use a
/// descriptive std::chrono::duration type instead. e.g. do not write this:
///
///   futures::sleep(Duration(1000))...
///
/// rather this:
///
///   futures::sleep(std::chrono::milliseconds(1000));
///
/// or this:
///
///   futures::sleep(std::chrono::seconds(1));
using Duration = std::chrono::milliseconds;

} // namespace folly
