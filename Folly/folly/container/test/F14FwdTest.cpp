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

#include <folly/container/F14Map-fwd.h>
#include <folly/container/F14Set-fwd.h>
#include <folly/portability/GTest.h>

namespace {
template <typename TContainer>
void foo(TContainer*) {}
} // namespace

TEST(F14Fwd, simple) {
  using namespace folly;
  foo<F14NodeMap<int, int>>(nullptr);
  foo<F14ValueMap<int, int>>(nullptr);
  foo<F14VectorMap<int, int>>(nullptr);
  foo<F14FastMap<int, int>>(nullptr);

  foo<F14NodeSet<int>>(nullptr);
  foo<F14ValueSet<int>>(nullptr);
  foo<F14VectorSet<int>>(nullptr);
  foo<F14FastSet<int>>(nullptr);
}
