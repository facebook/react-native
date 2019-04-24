/*
 * Copyright 2018-present Facebook, Inc.
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
#include <folly/experimental/settings/test/a.h>

#include <folly/experimental/settings/Settings.h>

namespace a_ns {
FOLLY_SETTING_DEFINE(follytest, public_flag_to_a, int, 456, "Public flag to a");
namespace {
FOLLY_SETTING_DEFINE(follytest, internal_flag_to_a, int, 789, "Desc of int");
}

int a_func() {
  return *FOLLY_SETTING(follytest, public_flag_to_a) +
      *FOLLY_SETTING(follytest, internal_flag_to_a);
}

void setRemote(int value) {
  FOLLY_SETTING(follytest, public_flag_to_a).set(value, "remote_set");
}

int getRemote() {
  return *FOLLY_SETTING(follytest, public_flag_to_a);
}

} // namespace a_ns
