/*
 * Copyright 2015-present Facebook, Inc.
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

#include <folly/futures/Future.h>
#include <folly/portability/GTest.h>

#include <memory>

using namespace folly;

class TestData : public RequestData {
 public:
  explicit TestData(int data) : data_(data) {}
  ~TestData() override {}

  bool hasCallback() override {
    return false;
  }

  int data_;
};

TEST(Context, basic) {
  // Start a new context
  folly::RequestContextScopeGuard rctx;

  EXPECT_EQ(nullptr, RequestContext::get()->getContextData("test"));

  // Set some test data
  RequestContext::get()->setContextData("test", std::make_unique<TestData>(10));

  // Start a future
  Promise<Unit> p;
  auto future = p.getFuture().thenValue([&](auto&&) {
    // Check that the context followed the future
    EXPECT_TRUE(RequestContext::get() != nullptr);
    auto a =
        dynamic_cast<TestData*>(RequestContext::get()->getContextData("test"));
    auto data = a->data_;
    EXPECT_EQ(10, data);
  });

  // Clear the context
  RequestContext::setContext(nullptr);

  EXPECT_EQ(nullptr, RequestContext::get()->getContextData("test"));

  // Fulfill the promise
  p.setValue();
}
