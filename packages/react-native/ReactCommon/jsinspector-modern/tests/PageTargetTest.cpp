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

/**
 * Simplified test harness focused on sending messages to and from a PageTarget.
 */
class PageTargetProtocolTest : public Test {
 public:
  PageTargetProtocolTest() {
    toPage_ = page_.connect(
        remoteConnections_.make_unique(),
        {.integrationName = "PageTargetProtocolTest"});

    // In protocol tests, we'll always get an onDisconnect call when we tear
    // down the test. Expect it in order to satisfy the strict mock.
    EXPECT_CALL(*remoteConnections_[0], onDisconnect());
  }

 protected:
  MockPageTargetDelegate pageTargetDelegate_;

  MockRemoteConnection& fromPage() {
    return *remoteConnections_[0];
  }

 private:
  PageTarget page_{pageTargetDelegate_};
  UniquePtrFactory<StrictMock<MockRemoteConnection>> remoteConnections_;

 protected:
  // NOTE: Needs to be destroyed before page_.
  std::unique_ptr<ILocalConnection> toPage_;
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

} // namespace facebook::react::jsinspector_modern
