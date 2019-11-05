/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <chrono>
#include <condition_variable>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <hermes/inspector/chrome/ConnectionDemux.h>
#include <jsinspector/InspectorInterfaces.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {

using ::facebook::react::IInspector;
using ::facebook::react::InspectorPage;
using ::facebook::react::IRemoteConnection;

namespace {

std::unordered_map<int, std::string> makePageMap(
    const std::vector<InspectorPage> &pages) {
  std::unordered_map<int, std::string> pageMap;

  for (auto &page : pages) {
    pageMap[page.id] = page.title;
  }

  return pageMap;
}

void expectPages(
    IInspector &inspector,
    const std::unordered_map<int, std::string> &expected) {
  auto pages = makePageMap(inspector.getPages());
  EXPECT_EQ(pages, expected);
}

class TestRemoteConnection : public IRemoteConnection {
 public:
  class Data {
   public:
    void expectDisconnected() {
      std::unique_lock<std::mutex> lock(mutex_);
      cv_.wait_for(
          lock, std::chrono::milliseconds(2500), [&] { return !connected_; });
      EXPECT_FALSE(connected_);
    }

    void setDisconnected() {
      std::lock_guard<std::mutex> lock(mutex_);
      connected_ = false;
      cv_.notify_one();
    }

   private:
    std::mutex mutex_;
    std::condition_variable cv_;
    bool connected_{true};
  };

  TestRemoteConnection() : data_(std::make_shared<Data>()) {}
  ~TestRemoteConnection() {}

  void onMessage(std::string message) override {}

  void onDisconnect() override {
    data_->setDisconnected();
  }

  std::shared_ptr<Data> getData() {
    return data_;
  }

 private:
  std::shared_ptr<Data> data_;
};

}; // namespace

TEST(ConnectionDemuxTests, TestEnableDisable) {
  std::shared_ptr<HermesRuntime> runtime1(
      facebook::hermes::makeHermesRuntime());
  std::shared_ptr<HermesRuntime> runtime2(
      facebook::hermes::makeHermesRuntime());
  auto inspector = facebook::react::makeTestInspectorInstance();

  ConnectionDemux demux{*inspector};

  int id1 = demux.enableDebugging(
      std::make_unique<SharedRuntimeAdapter>(runtime1), "page1");
  int id2 = demux.enableDebugging(
      std::make_unique<SharedRuntimeAdapter>(runtime2), "page2");

  expectPages(*inspector, {{id1, "page1"}, {id2, "page2"}});

  auto remoteConn1 = std::make_unique<TestRemoteConnection>();
  auto remoteData1 = remoteConn1->getData();
  auto localConn1 = inspector->connect(id1, std::move(remoteConn1));
  EXPECT_NE(localConn1.get(), nullptr);

  {
    // If we connect to the same page id again without disconnecting, we should
    // get null
    auto remoteConn = std::make_unique<TestRemoteConnection>();
    auto localConn = inspector->connect(id1, std::move(remoteConn));
    EXPECT_EQ(localConn.get(), nullptr);
  }

  auto remoteConn2 = std::make_unique<TestRemoteConnection>();
  auto remoteData2 = remoteConn2->getData();
  auto localConn2 = inspector->connect(id2, std::move(remoteConn2));
  EXPECT_NE(localConn2.get(), nullptr);

  // Disable debugging on runtime2. This should remove its page from the list
  // and call onDisconnect on its remoteConn
  demux.disableDebugging(*runtime2);
  expectPages(*inspector, {{id1, "page1"}});
  remoteData2->expectDisconnected();

  // Disconnect conn1. Its page should still be in the page list and
  // onDisconnect should be called.
  localConn1->disconnect();
  remoteData1->expectDisconnected();

  {
    // Should still be able to reconnect after disconnecting
    auto remoteConn = std::make_unique<TestRemoteConnection>();
    auto localConn = inspector->connect(id1, std::move(remoteConn));
    EXPECT_NE(localConn.get(), nullptr);
  }
}

} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
