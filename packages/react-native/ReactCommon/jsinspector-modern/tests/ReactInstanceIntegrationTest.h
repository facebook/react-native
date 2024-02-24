/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/json.h>
#include <gtest/gtest.h>
#include <jsinspector-modern/InspectorInterfaces.h>
#include <memory>

#include "InspectorMocks.h"
#include "ReactNativeMocks.h"
#include "UniquePtrFactory.h"

namespace facebook::react::jsinspector_modern {

class ReactInstanceIntegrationTest : public ::testing::Test {
 protected:
  ReactInstanceIntegrationTest();
  void SetUp() override;
  void TearDown() override;

  jsi::Value run(const std::string& script);
  bool verbose(bool isVerbose);

  void send(
      const std::string& method,
      const folly::dynamic& params = folly::dynamic::object());
  void sendJSONString(const std::string& message);

  jsi::Runtime* runtime;
  std::unique_ptr<react::ReactInstance> instance;
  std::shared_ptr<MockMessageQueueThread> messageQueueThread;
  std::shared_ptr<ErrorUtils> errorHandler;

  MockRemoteConnection& getRemoteConnection() {
    return *mockRemoteConnections_[0];
  }

 private:
  void initializeRuntime(std::string_view script);

  size_t id_ = 1;
  bool verbose_ = false;
  UniquePtrFactory<MockRemoteConnection> mockRemoteConnections_;
  std::unique_ptr<ILocalConnection> clientToVM_;
};

} // namespace facebook::react::jsinspector_modern
