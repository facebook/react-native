/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "WebSocketClientImpl.h"

#include <boost/asio/post.hpp>
#include <folly/ScopeGuard.h>
#include <folly/system/ThreadName.h>
#include <react/debug/react_native_assert.h>
#include <exception>

namespace facebook::react {

WebSocketClient::WebSocketClient() noexcept
    : impl_(std::make_shared<WebSocketClient::Impl>()) {}

WebSocketClient::~WebSocketClient() {
  react_native_assert(
      !impl_->isOnIOThread() &&
      "WebSocketClient must be destroyed on its external owner thread");
  try {
    WebSocketClient::close("Force close as WebSocketClient being destroyed");
  } catch (...) {
    try {
      impl_->isClosing_ = true;
      impl_->ioContext_.stop();
      std::lock_guard<std::mutex> lock(threadMutex_);
      if (thread_) {
        thread_->join();
        thread_.reset();
      }
      impl_->closeSocket();
    } catch (...) {
      std::terminate();
    }
  }
}

void WebSocketClient::setOnClosedCallback(
    OnClosedCallback&& callback) noexcept {
  impl_->onClosedCallback_ = std::move(callback);
}

void WebSocketClient::setOnMessageCallback(
    OnMessageCallback&& callback) noexcept {
  impl_->onMessageCallback_ = std::move(callback);
}

void WebSocketClient::connect(
    const std::string& url,
    OnConnectCallback&& callback) {
  std::lock_guard<std::mutex> lock(threadMutex_);
  if (thread_) {
    react_native_assert(false && "WebSocketClient::connect() called twice");
    return;
  }

  impl_->onConnectCallback_ = std::move(callback);
  impl_->uri_ = folly::Uri{url};

  // Resolve the domain name
  impl_->resolver_.async_resolve(
      impl_->uri_->hostname(),
      std::to_string(impl_->uri_->port()),
      [weakImpl = std::weak_ptr(impl_)](
          boost::system::error_code ec,
          const boost::asio::ip::tcp::resolver::results_type& results) {
        if (auto impl = weakImpl.lock()) {
          impl->onResolveCompleted(ec, results);
        }
      });

  // Start the I/O thread
  static std::atomic<int32_t> s_threadId{0};
  thread_ = std::make_unique<std::thread>(
      [weakImpl = std::weak_ptr(impl_), tid = s_threadId.fetch_add(1)]() {
        folly::setThreadName("WebSocket" + std::to_string(tid));
        if (auto impl = weakImpl.lock()) {
          impl->run();
        }
      });
}

void WebSocketClient::Impl::run() {
  auto restoreMarker =
      folly::makeGuard([previous = activeIO_]() { activeIO_ = previous; });
  activeIO_ = this;
  ioContext_.run();
}

void WebSocketClient::close(const std::string& reason) {
  std::unique_lock<std::mutex> lock(threadMutex_, std::defer_lock);
  closeImpl(reason, [this, &lock]() {
    if (impl_->isOnIOThread()) {
      return false;
    }
    lock.lock();
    if (thread_) {
      thread_->join();
      thread_.reset();
    }
    return true;
  });
}

void WebSocketClient::closeImpl(
    const std::string& reason,
    const std::function<bool()>& join) {
  if (!impl_->isClosing_.exchange(true)) {
    boost::asio::post(
        impl_->ioContext_, [weakImpl = std::weak_ptr(impl_), reason]() {
          if (auto impl = weakImpl.lock()) {
            impl->closeOnIOThread(reason);
          }
        });
    if (impl_->onClosedCallback_) {
      impl_->onClosedCallback_(reason);
    }
  }
  if (join()) {
    // The loop may have exited before the posted close could execute.
    impl_->closeSocket();
  }
}

void WebSocketClient::Impl::closeOnIOThread(const std::string& reason) {
  pendingPings_ = 0;
  resolver_.cancel();
  auto ws = ws_.wlock();
  if (ws->is_open()) {
    ws->async_close(
        boost::beast::websocket::close_reason(reason), [](auto&&) {});
  } else {
    boost::system::error_code ec;
    // NOLINTNEXTLINE(bugprone-unused-return-value): Boost may return void.
    (void)ws->next_layer().close(ec);
  }
}

void WebSocketClient::Impl::closeSocket() {
  resolver_.cancel();
  auto ws = ws_.wlock();
  boost::system::error_code ec;
  // NOLINTNEXTLINE(bugprone-unused-return-value): Boost may return void.
  (void)ws->next_layer().close(ec);
}

void WebSocketClient::send(const std::string& message) {
  {
    std::lock_guard<std::mutex> lock(impl_->mutexOut_);
    impl_->messagesOut_.emplace(message);
  }
  boost::asio::post(impl_->ioContext_, [weakImpl = std::weak_ptr(impl_)]() {
    if (auto impl = weakImpl.lock()) {
      impl->write();
    }
  });
}

void WebSocketClient::ping() {
  boost::asio::post(impl_->ioContext_, [weakImpl = std::weak_ptr(impl_)]() {
    if (auto impl = weakImpl.lock()) {
      impl->requestPing();
    }
  });
}

void WebSocketClient::Impl::requestPing() {
  if (isClosing_) {
    return;
  }
  ++pendingPings_;
  ping();
}

void WebSocketClient::Impl::ping() {
  if (isClosing_ || isPinging_ || pendingPings_ == 0) {
    return;
  }
  isPinging_ = true;
  --pendingPings_;
  auto ws = ws_.wlock();
  ws->async_ping(
      {}, [weakImpl = weak_from_this()](boost::beast::error_code ec) {
        auto impl = weakImpl.lock();
        if (!impl) {
          return;
        }
        impl->isPinging_ = false;
        if (impl->isClosing_) {
          impl->pendingPings_ = 0;
          return;
        }
        if (ec) {
          LOG(ERROR) << "Error pinging websocket: " << ec.message();
        }
        impl->ping();
      });
}

void WebSocketClient::Impl::onResolveCompleted(
    boost::system::error_code ec,
    const boost::asio::ip::tcp::resolver::results_type& results) {
  if (isClosing_) {
    return;
  }
  if (ec) {
    // TODO: Handle retry logic here
    onConnectCallback(false, "Failed to resolve host");
    return;
  }

  auto ws = ws_.wlock();
  // Make the connection on the IP address we get from a lookup
  boost::asio::async_connect(
      ws->next_layer(),
      results.begin(),
      results.end(),
      [weakImpl = weak_from_this()](
          boost::system::error_code ec, const auto& /*ep*/) {
        if (auto impl = weakImpl.lock()) {
          impl->onConnectionCompleted(ec);
        }
      });
}

void WebSocketClient::Impl::onConnectionCompleted(
    boost::system::error_code ec) {
  if (isClosing_) {
    return;
  }
  if (ec) {
    // TODO: Handle retry logic here
    onConnectCallback(false, "Failed to connect");
    return;
  }

  auto ws = ws_.wlock();
  // https://datatracker.ietf.org/doc/html/rfc6455#section-3:
  // > The "resource-name" (also known as /resource name/ in
  // > https://datatracker.ietf.org/doc/html/rfc6455#section-4.1)
  // > can be constructed by concatenating the following:
  // >
  // > o  "/" if the path component is empty
  // >
  // > o  the path component
  // >
  // > o  "?" if the query component is non-empty
  // >
  // > o  the query component
  auto resourceName = (uri_->path().empty() ? "/" : uri_->path()) +
      (uri_->query().empty() ? "" : "?" + uri_->query());
  // Perform the websocket handshake
  ws->async_handshake(
      uri_->host() +
          (uri_->port() == 0 ? "" : ":" + std::to_string(uri_->port())),
      resourceName,
      [weakImpl = weak_from_this()](boost::system::error_code ec) {
        if (auto impl = weakImpl.lock()) {
          impl->onHandshakeCompleted(ec);
        }
      });
}

void WebSocketClient::Impl::onHandshakeCompleted(boost::system::error_code ec) {
  if (isClosing_) {
    return;
  }
  if (ec) {
    // TODO: Handle retry logic here
    onConnectCallback(false, "Failed to handshake");
    return;
  }

  isConnected_ = true;
  onConnectCallback(true, "Connected");

  // Listen for any messages from the server
  listen();

  // Start writing any buffered messages
  write();
}

void WebSocketClient::Impl::listen() {
  if (isClosing_) {
    return;
  }
  auto ws = ws_.wlock();
  ws->async_read(
      buffer_,
      [weakImpl = weak_from_this()](
          boost::beast::error_code ec, std::size_t bytes_transferred) {
        auto impl = weakImpl.lock();
        if (!impl || impl->isClosing_) {
          return;
        }
        if (ec) {
          LOG(ERROR) << "Error reading from websocket: " << ec.message();
          return;
        }
        std::string message(
            boost::beast::buffers_to_string(impl->buffer_.data()));
        if (impl->onMessageCallback_) {
          impl->onMessageCallback_(message);
        }
        impl->buffer_.consume(bytes_transferred);
        impl->listen();
      });
}

void WebSocketClient::Impl::write() {
  if (isClosing_ || !isConnected_) {
    return;
  }
  if (isWriting_.exchange(true)) {
    return;
  }

  std::shared_ptr<std::string> message;
  {
    std::lock_guard<std::mutex> lock(mutexOut_);
    if (messagesOut_.empty()) {
      isWriting_ = false;
      return;
    }
    message = std::make_shared<std::string>(messagesOut_.front());
    messagesOut_.pop();
  }

  auto ws = ws_.wlock();
  ws->async_write(
      boost::beast::net::buffer(*message),
      [message, weakImpl = weak_from_this()](
          boost::beast::error_code ec,
          std::size_t /*bytes_transferred*/) mutable {
        auto impl = weakImpl.lock();
        if (!impl) {
          return;
        }
        impl->isWriting_ = false;
        if (impl->isClosing_) {
          return;
        }
        if (ec) {
          LOG(ERROR) << "Error writing to websocket: " << ec.message();
        }
        impl->write();
      });
}

void WebSocketClient::Impl::onConnectCallback(
    bool connected,
    const std::string& error) {
  if (onConnectCallback_) {
    onConnectCallback_(connected, error);
  }
}

WebSocketClientFactory getWebSocketClientFactory() {
  return []() { return std::make_unique<WebSocketClient>(); };
}

} // namespace facebook::react
