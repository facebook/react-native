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

#include <folly/experimental/hazptr/hazptr.h>

namespace folly {
namespace hazptr {

FOLLY_STATIC_CTOR_PRIORITY_MAX hazptr_domain default_domain_;

hazptr_stats hazptr_stats_;

bool hazptr_tc_enabled() {
  return HAZPTR_TC;
}

bool hazptr_priv_enabled() {
  return HAZPTR_PRIV;
}

} // namespace hazptr
} // namespace folly
