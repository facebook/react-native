/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/executors/QueuedImmediateExecutor.h>
#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <jsinspector-modern/HostTarget.h>
#include <jsinspector-modern/HostTargetSessionObserver.h>
#include <jsinspector-modern/InspectorInterfaces.h>

#include <memory>

#include "InspectorMocks.h"
#include "UniquePtrFactory.h"

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

namespace {

class HostTargetSessionObserverTest : public Test {
  folly::QueuedImmediateExecutor immediateExecutor_;

 protected:
  HostTargetSessionObserverTest() {
    EXPECT_CALL(runtimeTargetDelegate_, createAgentDelegate(_, _, _, _, _))
        .WillRepeatedly(runtimeAgentDelegates_.lazily_make_unique<
                        FrontendChannel,
                        SessionState&,
                        std::unique_ptr<RuntimeAgentDelegate::ExportedState>,
                        const ExecutionContextDescription&,
                        RuntimeExecutor>());
  }

  void connect() {
    auto connection = makeConnection();

    pageConnectionsPointers_.push_back(std::move(connection.first));
  }

  std::pair<std::unique_ptr<ILocalConnection>, MockRemoteConnection&>
  makeConnection() {
    size_t connectionIndex = remoteConnections_.objectsVended();
    auto toPage = page_->connect(remoteConnections_.make_unique());

    // We'll always get an onDisconnect call when we tear
    // down the test. Expect it in order to satisfy the strict mock.
    EXPECT_CALL(*remoteConnections_[connectionIndex], onDisconnect());
    return {std::move(toPage), *remoteConnections_[connectionIndex]};
  }

  MockHostTargetDelegate hostTargetDelegate_;

  VoidExecutor inspectorExecutor_ = [this](auto callback) {
    immediateExecutor_.add(callback);
  };

  std::shared_ptr<HostTarget> page_ =
      HostTarget::create(hostTargetDelegate_, inspectorExecutor_);

  MockRuntimeTargetDelegate runtimeTargetDelegate_;

  UniquePtrFactory<StrictMock<MockRuntimeAgentDelegate>> runtimeAgentDelegates_;

 private:
  UniquePtrFactory<StrictMock<MockRemoteConnection>> remoteConnections_;

 protected:
  std::vector<std::unique_ptr<ILocalConnection>> pageConnectionsPointers_;
};
} // namespace

TEST_F(HostTargetSessionObserverTest, HasNoActiveSessionsByDefault) {
  EXPECT_FALSE(HostTargetSessionObserver::getInstance().hasActiveSessions());
}

TEST_F(HostTargetSessionObserverTest, HasActiveSessionOnceConnected) {
  connect();
  EXPECT_TRUE(HostTargetSessionObserver::getInstance().hasActiveSessions());
}

TEST_F(HostTargetSessionObserverTest, HasNoActiveSessionsOnceDisconnected) {
  connect();
  EXPECT_TRUE(HostTargetSessionObserver::getInstance().hasActiveSessions());

  pageConnectionsPointers_[0]->disconnect();
  EXPECT_FALSE(HostTargetSessionObserver::getInstance().hasActiveSessions());
}

TEST_F(HostTargetSessionObserverTest, WorksWithMultipleConnections) {
  connect();
  EXPECT_TRUE(HostTargetSessionObserver::getInstance().hasActiveSessions());

  connect();
  EXPECT_TRUE(HostTargetSessionObserver::getInstance().hasActiveSessions());

  pageConnectionsPointers_[0]->disconnect();
  EXPECT_TRUE(HostTargetSessionObserver::getInstance().hasActiveSessions());

  pageConnectionsPointers_[1]->disconnect();
  EXPECT_FALSE(HostTargetSessionObserver::getInstance().hasActiveSessions());
}

} // namespace facebook::react::jsinspector_modern
