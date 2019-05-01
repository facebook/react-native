/*
 * Copyright 2017-present Facebook, Inc.
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

/* Tag any class as `cold` by inheriting from folly::cold::ColdClass
 *
 * Intended use: things like folly::Unexpected which are designed to only be
 * instantiated on error paths.
 */
#pragma once

#include <folly/CppAttributes.h>

namespace folly {
// ColdClass should be in its own namespace: inheriting from any class adds its
// innermost namespace to the namespaces inspected during
// argument-dependent-lookoup. We want people to be able to derive from this
// without implicitly picking up the folly namespace for ADL on their classes.
namespace cold_detail {
struct ColdClass {
  FOLLY_COLD ColdClass() noexcept;
};
} // namespace cold_detail

/* using override */ using cold_detail::ColdClass;
} // namespace folly
