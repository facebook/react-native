/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SyncConnection.h"

#include <functional>
#include <stdexcept>

#include <folly/json.h>
#include <glog/logging.h>
#include <hermes/inspector/RuntimeAdapter.h>
#include <jsinspector/InspectorInterfaces.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {

using namespace std::placeholders;
using ::facebook::react::IRemoteConnection;

namespace {

std::string prettify(const std::string &str) {
  try {
    folly::dynamic obj = folly::parseJson(str);
    return folly::toPrettyJson(obj);
  } catch (...) {
    // pass
  }

  return str;
}

} // namespace

class SyncConnection::RemoteConnnection : public IRemoteConnection {
 public:
  RemoteConnnection(SyncConnection &conn) : conn_(conn) {}

  void onMessage(std::string message) override {
    conn_.onReply(message);
  }

  void onDisconnect() override {}

 private:
  SyncConnection &conn_;
};

SyncConnection::SyncConnection(
    std::shared_ptr<HermesRuntime> runtime,
    bool waitForDebugger)
    : connection_(
          std::make_unique<SharedRuntimeAdapter>(
              runtime,
              runtime->getDebugger()),
          "testConn",
          waitForDebugger) {
  connection_.connect(std::make_unique<RemoteConnnection>(*this));
}

void SyncConnection::send(const std::string &str) {
  LOG(INFO) << "SyncConnection::send sending " << str;

  connection_.sendMessage(str);
}

void SyncConnection::waitForResponse(
    folly::Function<void(const std::string &)> handler,
    std::chrono::milliseconds timeout) {
  std::string reply;

  {
    std::unique_lock<std::mutex> lock(mutex_);

    bool success = hasReply_.wait_for(
        lock, timeout, [this]() -> bool { return !replies_.empty(); });

    if (!success) {
      throw std::runtime_error("timed out waiting for reply");
    }

    reply = std::move(replies_.front());
    replies_.pop();
  }

  handler(reply);
}

void SyncConnection::waitForNotification(
    folly::Function<void(const std::string &)> handler,
    std::chrono::milliseconds timeout) {
  std::string notification;

  {
    std::unique_lock<std::mutex> lock(mutex_);

    bool success = hasNotification_.wait_for(
        lock, timeout, [this]() -> bool { return !notifications_.empty(); });

    if (!success) {
      throw std::runtime_error("timed out waiting for notification");
    }

    notification = std::move(notifications_.front());
    notifications_.pop();
  }

  handler(notification);
}

void SyncConnection::onReply(const std::string &message) {
  LOG(INFO) << "SyncConnection::onReply got message: " << prettify(message);

  std::lock_guard<std::mutex> lock(mutex_);

  folly::dynamic obj = folly::parseJson(message);
  if (obj.count("id")) {
    replies_.push(message);
    hasReply_.notify_one();
  } else {
    notifications_.push(message);
    hasNotification_.notify_one();
  }
}

} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
