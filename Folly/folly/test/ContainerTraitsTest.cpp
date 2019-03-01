/*
 * Copyright 2017 Facebook, Inc.
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

#include <folly/ContainerTraits.h>

#include <folly/portability/GTest.h>

using namespace std;
using namespace folly;

struct Node {
  size_t copies = 0;
  Node() noexcept {}
  Node(const Node& n) noexcept { copies = n.copies; ++copies; }
  Node(Node&& n) noexcept { swap(copies, n.copies); ++copies; }
};

template <class T>
class VectorWrapper {
public:
  using value_type = T;
  vector<T>& underlying;
  explicit VectorWrapper(vector<T>& v) : underlying(v) {}
  void push_back(const T& t) { underlying.push_back(t); }
};

TEST(ContainerTraits, WithoutEmplaceBack) {
  vector<Node> v;
  VectorWrapper<Node> vw(v);
  container_emplace_back_or_push_back(vw);
  EXPECT_EQ(1, v.at(0).copies);
}

TEST(ContainerTraits, WithEmplaceBack) {
  vector<Node> v;
  container_emplace_back_or_push_back(v);
  EXPECT_EQ(0, v.at(0).copies);
}
