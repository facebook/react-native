/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/http/WebSocketClient.h>

#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <folly/Synchronized.h>
#include <folly/Uri.h>
#include <atomic>
#include <cstddef>
#include <mutex>
#include <optional>
#include <queue>

namespace facebook::react {

struct WebSocketClient::Impl final : public std::enable_shared_from_this<Impl> {
  void onResolveCompleted(boost::system::error_code ec, const boost::asio::ip::tcp::resolver::results_type &results);
  void onConnectionCompleted(boost::system::error_code ec);
  void onHandshakeCompleted(boost::system::error_code ec);
  void listen();
  void write();
  void onConnectCallback(bool connected, const std::string &error);
  void run();
  bool isOnIOThread() const noexcept
  {
    return activeIO_ == this;
  }
  void requestPing();
  void ping();
  void closeOnIOThread(const std::string &reason);
  void closeSocket();

  inline static thread_local const Impl *activeIO_{nullptr};
  std::size_t pendingPings_{0};
  bool isPinging_{false};

  OnConnectCallback onConnectCallback_;
  OnClosedCallback onClosedCallback_;
  OnMessageCallback onMessageCallback_;
  std::optional<folly::Uri> uri_;

  boost::asio::io_context ioContext_;
  boost::asio::ip::tcp::resolver resolver_{ioContext_};
  boost::beast::multi_buffer buffer_;
  folly::Synchronized<boost::beast::websocket::stream<boost::asio::ip::tcp::socket>> ws_{
      boost::beast::websocket::stream<boost::asio::ip::tcp::socket>{ioContext_}};

  std::mutex mutexOut_;
  std::queue<std::string> messagesOut_;
  std::atomic<bool> isWriting_{false};
  std::atomic<bool> isConnected_{false};
  std::atomic<bool> isClosing_{false};
};

} // namespace facebook::react
