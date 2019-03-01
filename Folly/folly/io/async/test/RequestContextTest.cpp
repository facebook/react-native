/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
#include <thread>

#include <folly/Memory.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/Request.h>
#include <folly/portability/GTest.h>

using namespace folly;

class TestData : public RequestData {
 public:
  explicit TestData(int data) : data_(data) {}
  ~TestData() override {}
  void onSet() override {
    set_++;
  }
  void onUnset() override {
    unset_++;
  }
  int set_ = 0, unset_ = 0;
  int data_;
};

TEST(RequestContext, SimpleTest) {
  EventBase base;


  // There should always be a default context with get()
  EXPECT_TRUE(RequestContext::get() != nullptr);


  // but not with saveContext()
  EXPECT_EQ(RequestContext::saveContext(), nullptr);
  RequestContext::create();
  EXPECT_NE(RequestContext::saveContext(), nullptr);
  RequestContext::create();
  EXPECT_NE(RequestContext::saveContext(), nullptr);

  EXPECT_EQ(nullptr, RequestContext::get()->getContextData("test"));

  RequestContext::get()->setContextData(
      "test", folly::make_unique<TestData>(10));
  base.runInEventBaseThread([&](){
      EXPECT_TRUE(RequestContext::get() != nullptr);
      auto data = dynamic_cast<TestData*>(
        RequestContext::get()->getContextData("test"))->data_;
      EXPECT_EQ(10, data);
      base.terminateLoopSoon();
    });
  auto th = std::thread([&](){
      base.loopForever();
  });
  th.join();
  EXPECT_TRUE(RequestContext::get() != nullptr);
  auto a = dynamic_cast<TestData*>(
    RequestContext::get()->getContextData("test"));
  auto data = a->data_;
  EXPECT_EQ(10, data);

  RequestContext::setContext(std::shared_ptr<RequestContext>());
  // There should always be a default context
  EXPECT_TRUE(nullptr != RequestContext::get());
}

TEST(RequestContext, setIfAbsentTest) {
  EXPECT_TRUE(RequestContext::get() != nullptr);

  RequestContext::get()->setContextData(
      "test", folly::make_unique<TestData>(10));
  EXPECT_FALSE(RequestContext::get()->setContextDataIfAbsent(
      "test", folly::make_unique<TestData>(20)));
  EXPECT_EQ(10,
            dynamic_cast<TestData*>(
                RequestContext::get()->getContextData("test"))->data_);

  EXPECT_TRUE(RequestContext::get()->setContextDataIfAbsent(
      "test2", folly::make_unique<TestData>(20)));
  EXPECT_EQ(20,
            dynamic_cast<TestData*>(
                RequestContext::get()->getContextData("test2"))->data_);

  RequestContext::setContext(std::shared_ptr<RequestContext>());
  EXPECT_TRUE(nullptr != RequestContext::get());
}

TEST(RequestContext, testSetUnset) {
  RequestContext::create();
  auto ctx1 = RequestContext::saveContext();
  ctx1->setContextData("test", folly::make_unique<TestData>(10));
  auto testData1 = dynamic_cast<TestData*>(ctx1->getContextData("test"));

  // Override RequestContext
  RequestContext::create();
  auto ctx2 = RequestContext::saveContext();
  ctx2->setContextData("test", folly::make_unique<TestData>(20));
  auto testData2 = dynamic_cast<TestData*>(ctx2->getContextData("test"));

  // Check ctx1->onUnset was called
  EXPECT_EQ(0, testData1->set_);
  EXPECT_EQ(1, testData1->unset_);

  RequestContext::setContext(ctx1);
  EXPECT_EQ(1, testData1->set_);
  EXPECT_EQ(1, testData1->unset_);
  EXPECT_EQ(0, testData2->set_);
  EXPECT_EQ(1, testData2->unset_);

  RequestContext::setContext(ctx2);
  EXPECT_EQ(1, testData1->set_);
  EXPECT_EQ(2, testData1->unset_);
  EXPECT_EQ(1, testData2->set_);
  EXPECT_EQ(1, testData2->unset_);
}

TEST(RequestContext, deadlockTest) {
  class DeadlockTestData : public RequestData {
   public:
    explicit DeadlockTestData(const std::string& val) : val_(val) {}

    virtual ~DeadlockTestData() {
      RequestContext::get()->setContextData(
          val_, folly::make_unique<TestData>(1));
    }

    void onSet() override {}

    void onUnset() override {}

    std::string val_;
  };

  RequestContext::get()->setContextData(
      "test", folly::make_unique<DeadlockTestData>("test2"));
  RequestContext::get()->clearContextData("test");
}
