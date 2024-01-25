/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <folly/json.h>
#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/PageTarget.h>

#include <memory>

#include "FollyDynamicMatchers.h"
#include "InspectorMocks.h"
#include "UniquePtrFactory.h"

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

namespace {

class PageTargetTest : public Test {
 protected:
  void connect() {
    ASSERT_FALSE(toPage_) << "Can only connect once in a PageTargetTest.";
    toPage_ = page_.connect(
        remoteConnections_.make_unique(),
        {.integrationName = "PageTargetTest"});

    // We'll always get an onDisconnect call when we tear
    // down the test. Expect it in order to satisfy the strict mock.
    EXPECT_CALL(*remoteConnections_[0], onDisconnect());
  }

  MockPageTargetDelegate pageTargetDelegate_;

  MockRemoteConnection& fromPage() {
    assert(toPage_);
    return *remoteConnections_[0];
  }

  PageTarget page_{pageTargetDelegate_};

 private:
  UniquePtrFactory<StrictMock<MockRemoteConnection>> remoteConnections_;

 protected:
  // NOTE: Needs to be destroyed before page_.
  std::unique_ptr<ILocalConnection> toPage_;
};

/**
 * Simplified test harness focused on sending messages to and from a PageTarget.
 */
class PageTargetProtocolTest : public PageTargetTest {
 public:
  PageTargetProtocolTest() {
    connect();
  }

 private:
  // Protocol tests shouldn't manually call connect()
  using PageTargetTest::connect;
};

} // namespace

TEST_F(PageTargetProtocolTest, UnrecognizedMethod) {
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32601)), AtJsonPtr("/id", Eq(1))))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "SomeUnrecognizedMethod",
                           "params": [1, 2]
                         })");
}

TEST_F(PageTargetProtocolTest, TypeErrorInMethodName) {
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32600)),
          AtJsonPtr("/id", Eq(nullptr))))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": 42,
                           "params": [1, 2]
                         })");
}

TEST_F(PageTargetProtocolTest, MissingId) {
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32600)),
          AtJsonPtr("/id", Eq(nullptr))))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "method": "SomeUnrecognizedMethod",
                           "params": [1, 2]
                         })");
}

TEST_F(PageTargetProtocolTest, MalformedJson) {
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32700)),
          AtJsonPtr("/id", Eq(nullptr))))))
      .RetiresOnSaturation();
  toPage_->sendMessage("{");
}

TEST_F(PageTargetProtocolTest, InjectLogsToIdentifyBackend) {
  InSequence s;

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": null
                                             })")))
      .RetiresOnSaturation();

  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/method", "Log.entryAdded"),
          AtJsonPtr("/params/entry", Not(IsEmpty()))))))
      .Times(2)
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Log.enable"
                         })");
}

TEST_F(PageTargetProtocolTest, PageReloadMethod) {
  InSequence s;

  EXPECT_CALL(
      pageTargetDelegate_,
      onReload(Eq(PageTargetDelegate::PageReloadRequest{
          .ignoreCache = std::nullopt,
          .scriptToEvaluateOnLoad = std::nullopt})))
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Page.reload"
                         })");

  EXPECT_CALL(
      pageTargetDelegate_,
      onReload(Eq(PageTargetDelegate::PageReloadRequest{
          .ignoreCache = true, .scriptToEvaluateOnLoad = "alert('hello');"})))
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 2,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 2,
                           "method": "Page.reload",
                           "params": {
                             "ignoreCache": true,
                             "scriptToEvaluateOnLoad": "alert('hello');"
                           }
                         })");
}

TEST_F(PageTargetProtocolTest, RegisterUnregisterInstanceWithoutEvents) {
  MockInstanceTargetDelegate instanceTargetDelegate;

  auto& instanceTarget = page_.registerInstance(instanceTargetDelegate);

  page_.unregisterInstance(instanceTarget);
}

TEST_F(PageTargetTest, ConnectToAlreadyRegisteredInstanceWithoutEvents) {
  MockInstanceTargetDelegate instanceTargetDelegate;

  auto& instanceTarget = page_.registerInstance(instanceTargetDelegate);

  connect();

  page_.unregisterInstance(instanceTarget);
}

TEST_F(PageTargetProtocolTest, RegisterUnregisterInstanceWithEvents) {
  InSequence s;

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")));
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Runtime.enable"
                         })");

  MockInstanceTargetDelegate instanceTargetDelegate;

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "method": "Runtime.executionContextCreated",
                                               "params": {
                                                 "context": {
                                                   "id": 1,
                                                   "origin": "",
                                                   "name": "React Native"
                                                 }
                                               }
                                             })")));
  auto& instanceTarget = page_.registerInstance(instanceTargetDelegate);

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "method": "Runtime.executionContextDestroyed",
                                               "params": {
                                                 "executionContextId": 1
                                               }
                                             })")));
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "method": "Runtime.executionContextsCleared"
                                             })")));
  page_.unregisterInstance(instanceTarget);
}

TEST_F(PageTargetTest, ConnectToAlreadyRegisteredInstanceWithEvents) {
  MockInstanceTargetDelegate instanceTargetDelegate;
  auto& instanceTarget = page_.registerInstance(instanceTargetDelegate);

  connect();

  InSequence s;

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")));
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "method": "Runtime.executionContextCreated",
                                               "params": {
                                                 "context": {
                                                   "id": 1,
                                                   "origin": "",
                                                   "name": "React Native"
                                                 }
                                               }
                                             })")));

  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Runtime.enable"
                         })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "method": "Runtime.executionContextDestroyed",
                                               "params": {
                                                 "executionContextId": 1
                                               }
                                             })")));
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "method": "Runtime.executionContextsCleared"
                                             })")));
  page_.unregisterInstance(instanceTarget);
}

TEST_F(PageTargetProtocolTest, RespondToHeapUsageMethodWhileInstanceExists) {
  // NOTE: This test will be deleted once we add some real CDP method
  // implementations to InstanceAgent.

  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32601)), AtJsonPtr("/id", Eq(1))))))
      .RetiresOnSaturation();

  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Runtime.getHeapUsage"
                         })");

  MockInstanceTargetDelegate instanceTargetDelegate;
  auto& instanceTarget = page_.registerInstance(instanceTargetDelegate);

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 2,
                                               "result": {
                                                 "usedSize": 0,
                                                 "totalSize": 0
                                               }
                                             })")));

  toPage_->sendMessage(R"({
                           "id": 2,
                           "method": "Runtime.getHeapUsage"
                         })");

  page_.unregisterInstance(instanceTarget);

  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32601)), AtJsonPtr("/id", Eq(3))))))
      .RetiresOnSaturation();

  toPage_->sendMessage(R"({
                           "id": 3,
                           "method": "Runtime.getHeapUsage"
                         })");
}

} // namespace facebook::react::jsinspector_modern
