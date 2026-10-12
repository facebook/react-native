/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <boost/asio/executor_work_guard.hpp>
#include <boost/asio/post.hpp>
#include <gtest/gtest.h>
#include <react/http/WebSocketClient.h>
#include <unistd.h>
#include <cstdlib>
#include <future>
#include <sstream>
#include <stdexcept>
#include "WebSocketClientImpl.h"

namespace facebook::react {

class WebSocketClientTestPeer {
 public:
  static auto impl(const WebSocketClient& client) {
    return client.impl_;
  }

  static bool hasThread(const WebSocketClient& client) {
    return client.thread_ != nullptr;
  }

  static void close(
      WebSocketClient& client,
      const std::string& reason,
      const std::function<bool()>& join) {
    client.closeImpl(reason, join);
  }
};

TEST(WebSocketClientTest, DestructionJoinsAfterThrowingClosedCallback) {
  auto client = std::make_unique<WebSocketClient>();
  auto impl = WebSocketClientTestPeer::impl(*client);
  auto work = boost::asio::make_work_guard(impl->ioContext_);
  auto entered = std::make_shared<std::promise<void>>();
  auto enteredFuture = entered->get_future();
  boost::asio::post(impl->ioContext_, [entered] { entered->set_value(); });
  int closes = 0;
  client->connect(
      "ws://127.0.0.1:0",
      [](bool /*connected*/, const std::string& /*reason*/) {});
  ASSERT_EQ(
      enteredFuture.wait_for(std::chrono::seconds(5)),
      std::future_status::ready);
  EXPECT_TRUE(WebSocketClientTestPeer::hasThread(*client));
  client->setOnClosedCallback([&](const std::string& /*reason*/) {
    ++closes;
    throw std::runtime_error("closed callback failure");
  });

  client.reset();

  EXPECT_EQ(closes, 1);
  EXPECT_TRUE(impl->isClosing_);
  EXPECT_TRUE(impl->ioContext_.stopped());
}

TEST(WebSocketClientTest, CloseDoesNotHoldSocketLockAcrossJoin) {
  WebSocketClient client;
  auto impl = WebSocketClientTestPeer::impl(client);
  bool callbackRan = false;
  boost::asio::post(impl->ioContext_, [&]() {
    auto ws = impl->ws_.tryWLock();
    EXPECT_TRUE(ws);
    EXPECT_TRUE(impl->isClosing_);
    callbackRan = true;
  });

  WebSocketClientTestPeer::close(client, "test close", [&]() {
    {
      auto ws = impl->ws_.tryWLock();
      EXPECT_TRUE(ws);
      if (!ws) {
        return false;
      }
    }
    impl->run();
    return true;
  });

  EXPECT_TRUE(callbackRan);
}

TEST(WebSocketClientTest, CloseIsReentrantAndNotifiesOnceBeforeJoining) {
  WebSocketClient client;
  auto impl = WebSocketClientTestPeer::impl(client);
  int closes = 0;
  int joins = 0;
  client.setOnClosedCallback([&](const std::string& reason) {
    EXPECT_EQ(reason, "first close");
    ++closes;
    WebSocketClientTestPeer::close(client, "nested close", [&]() {
      ++joins;
      EXPECT_GE(impl->ioContext_.poll(), 1);
      return true;
    });
  });

  WebSocketClientTestPeer::close(client, "first close", [&]() {
    EXPECT_EQ(closes, 1);
    ++joins;
    return true;
  });
  WebSocketClientTestPeer::close(client, "later close", [&]() {
    ++joins;
    return true;
  });

  EXPECT_EQ(closes, 1);
  EXPECT_EQ(joins, 3);
}

TEST(WebSocketClientTest, CloseRequestDefersSocketCleanupUntilOwnerJoin) {
  WebSocketClient client;
  auto impl = WebSocketClientTestPeer::impl(client);
  {
    auto ws = impl->ws_.wlock();
    boost::system::error_code ec;
    // NOLINTNEXTLINE(bugprone-unused-return-value): Boost may return void.
    (void)ws->next_layer().open(boost::asio::ip::tcp::v4(), ec);
    ASSERT_FALSE(ec);
  }
  WebSocketClientTestPeer::close(
      client, "request only", []() { return false; });
  {
    auto ws = impl->ws_.wlock();
    EXPECT_TRUE(ws->next_layer().is_open());
  }

  bool joined = false;
  WebSocketClientTestPeer::close(client, "owner join", [&]() {
    joined = true;
    return true;
  });

  EXPECT_TRUE(joined);
  auto ws = impl->ws_.wlock();
  EXPECT_FALSE(ws->next_layer().is_open());
}

TEST(WebSocketClientTest, CloseDropsLateConnectionCompletions) {
  WebSocketClient client;
  auto impl = WebSocketClientTestPeer::impl(client);
  int connects = 0;
  impl->onConnectCallback_ = [&](bool, const std::string&) { ++connects; };
  client.close("cancel connection");

  for (auto ec :
       {boost::system::error_code{},
        boost::system::error_code(boost::asio::error::operation_aborted)}) {
    impl->onResolveCompleted(ec, {});
    impl->onConnectionCompleted(ec);
    impl->onHandshakeCompleted(ec);
  }

  EXPECT_EQ(connects, 0);
  EXPECT_FALSE(impl->isConnected_);
}

TEST(WebSocketClientTest, CloseWithoutRunningLoopDoesNotRetainImpl) {
  auto client = std::make_unique<WebSocketClient>();
  auto impl = WebSocketClientTestPeer::impl(*client);
  std::weak_ptr weakImpl = impl;
  client->close("no IO loop");
  impl.reset();
  client.reset();
  EXPECT_TRUE(weakImpl.expired());
}

TEST(WebSocketClientTest, DestructorDoesNotThrowForInvalidSocketDescriptor) {
  EXPECT_EXIT(
      {
        {
          WebSocketClient client;
          auto impl = WebSocketClientTestPeer::impl(client);
          auto ws = impl->ws_.wlock();
          boost::system::error_code ec;
          // NOLINTNEXTLINE(bugprone-unused-return-value): void overload.
          (void)ws->next_layer().open(boost::asio::ip::tcp::v4(), ec);
          if (ec || ::close(ws->next_layer().native_handle()) != 0) {
            std::_Exit(1);
          }
        }
        std::_Exit(0);
      },
      ::testing::ExitedWithCode(0),
      "");
}

TEST(WebSocketClientTest, LoopbackHandshakeMessagesPingAndGracefulClose) {
  boost::asio::io_context serverIO;
  boost::asio::ip::tcp::acceptor acceptor(
      serverIO, {boost::asio::ip::make_address("127.0.0.1"), 0});
  boost::beast::websocket::stream<boost::asio::ip::tcp::socket> server(
      serverIO);
  boost::beast::flat_buffer buffer;
  std::promise<void> pinged;
  int pings = 0;
  server.control_callback([&](auto type, auto) {
    if (type == boost::beast::websocket::frame_type::ping && ++pings == 2) {
      pinged.set_value();
    }
  });
  std::promise<boost::system::error_code> serverClosed;
  std::string received;
  acceptor.async_accept(server.next_layer(), [&](auto ec) {
    if (ec) {
      serverClosed.set_value(ec);
      return;
    }
    server.async_accept([&](auto ec) {
      if (ec) {
        serverClosed.set_value(ec);
        return;
      }
      server.async_read(buffer, [&](auto ec, auto) {
        if (ec) {
          serverClosed.set_value(ec);
          return;
        }
        received = boost::beast::buffers_to_string(buffer.data());
        server.async_write(boost::asio::buffer(received), [&](auto ec, auto) {
          if (ec) {
            serverClosed.set_value(ec);
            return;
          }
          buffer.consume(buffer.size());
          server.async_read(
              buffer, [&](auto ec, auto) { serverClosed.set_value(ec); });
        });
      });
    });
  });
  std::thread serverThread([&]() { serverIO.run(); });
  WebSocketClient client;
  client.setOnClosedCallback(
      [&](const std::string&) { client.close("nested external close"); });
  std::promise<bool> connected;
  std::promise<std::string> message;
  client.setOnMessageCallback(
      [&](const std::string& value) { message.set_value(value); });
  std::ostringstream url;
  url << "ws://127.0.0.1:" << acceptor.local_endpoint().port()
      << "/test?token=1";
  client.send("before handshake");
  client.connect(url.str(), [&](bool success, const std::string&) {
    connected.set_value(success);
  });
  auto connectedFuture = connected.get_future();
  auto messageFuture = message.get_future();
  auto pingFuture = pinged.get_future();
  EXPECT_EQ(
      connectedFuture.wait_for(std::chrono::seconds(5)),
      std::future_status::ready);
  if (connectedFuture.wait_for(std::chrono::seconds(0)) ==
      std::future_status::ready) {
    EXPECT_TRUE(connectedFuture.get());
  }
  EXPECT_EQ(
      messageFuture.wait_for(std::chrono::seconds(5)),
      std::future_status::ready);
  if (messageFuture.wait_for(std::chrono::seconds(0)) ==
      std::future_status::ready) {
    EXPECT_EQ(messageFuture.get(), "before handshake");
  }
  std::promise<void> enteredIO;
  std::promise<void> releaseIO;
  auto enteredFuture = enteredIO.get_future();
  auto releaseFuture = releaseIO.get_future();
  auto impl = WebSocketClientTestPeer::impl(client);
  boost::asio::post(impl->ioContext_, [&]() {
    enteredIO.set_value();
    releaseFuture.wait();
  });
  EXPECT_EQ(
      enteredFuture.wait_for(std::chrono::seconds(5)),
      std::future_status::ready);
  client.ping();
  client.ping();
  releaseIO.set_value();
  EXPECT_EQ(
      pingFuture.wait_for(std::chrono::seconds(5)), std::future_status::ready);
  client.close("loopback done");
  auto closeFuture = serverClosed.get_future();
  EXPECT_EQ(
      closeFuture.wait_for(std::chrono::seconds(5)), std::future_status::ready);
  if (closeFuture.wait_for(std::chrono::seconds(0)) ==
      std::future_status::ready) {
    EXPECT_EQ(closeFuture.get(), boost::beast::websocket::error::closed);
  }
  serverIO.stop();
  serverThread.join();
  EXPECT_EQ(received, "before handshake");
  EXPECT_EQ(pings, 2);
}

class WebSocketClientCallbackCloseTest : public ::testing::Test {
 protected:
  void verifyClose(bool fromMessage) {
    boost::asio::io_context serverIO;
    boost::asio::ip::tcp::acceptor acceptor(
        serverIO, {boost::asio::ip::make_address("127.0.0.1"), 0});
    boost::beast::websocket::stream<boost::asio::ip::tcp::socket> server(
        serverIO);
    boost::beast::flat_buffer buffer;
    std::string payload = "close from message";
    std::promise<boost::system::error_code> serverClosed;
    auto readForClose = [&]() {
      server.async_read(
          buffer, [&](auto ec, auto) { serverClosed.set_value(ec); });
    };
    acceptor.async_accept(server.next_layer(), [&](auto ec) {
      if (ec) {
        serverClosed.set_value(ec);
        return;
      }
      server.async_accept([&](auto ec) {
        if (ec) {
          serverClosed.set_value(ec);
          return;
        }
        if (fromMessage) {
          server.async_write(boost::asio::buffer(payload), [&](auto ec, auto) {
            if (ec) {
              serverClosed.set_value(ec);
              return;
            }
            readForClose();
          });
        } else {
          readForClose();
        }
      });
    });
    std::thread serverThread([&]() { serverIO.run(); });
    auto client = std::make_unique<WebSocketClient>();
    auto impl = WebSocketClientTestPeer::impl(*client);
    std::weak_ptr weakImpl = impl;
    int notifications = 0;
    client->setOnClosedCallback([&](const std::string&) {
      ++notifications;
      client->close("nested callback close");
    });
    std::promise<bool> callbackReturned;
    auto callbackFuture = callbackReturned.get_future();
    if (fromMessage) {
      client->setOnMessageCallback([&](const std::string& message) {
        EXPECT_EQ(message, payload);
        EXPECT_TRUE(impl->isOnIOThread());
        client->close("message callback close");
        callbackReturned.set_value(true);
      });
    }
    std::ostringstream url;
    url << "ws://127.0.0.1:" << acceptor.local_endpoint().port()
        << "/callback-close";
    client->connect(url.str(), [&](bool success, const std::string&) {
      if (!fromMessage || !success) {
        EXPECT_TRUE(impl->isOnIOThread());
        client->close("connect callback close");
        callbackReturned.set_value(success);
      }
    });
    const bool requestedClose =
        callbackFuture.wait_for(std::chrono::seconds(5)) ==
        std::future_status::ready;
    EXPECT_TRUE(requestedClose);
    if (requestedClose) {
      EXPECT_TRUE(callbackFuture.get());
      EXPECT_TRUE(WebSocketClientTestPeer::hasThread(*client));
    }
    if (!fromMessage || !requestedClose) {
      client->close("external owner close");
      EXPECT_FALSE(WebSocketClientTestPeer::hasThread(*client));
    }
    client.reset();
    EXPECT_EQ(notifications, 1);
    auto closeFuture = serverClosed.get_future();
    EXPECT_EQ(
        closeFuture.wait_for(std::chrono::seconds(5)),
        std::future_status::ready);
    if (closeFuture.wait_for(std::chrono::seconds(0)) ==
        std::future_status::ready) {
      EXPECT_EQ(closeFuture.get(), boost::beast::websocket::error::closed);
    }
    serverIO.stop();
    serverThread.join();
    impl.reset();
    EXPECT_TRUE(weakImpl.expired());
  }
};

TEST_F(
    WebSocketClientCallbackCloseTest,
    CloseFromConnectKeepsThreadForOwnerJoin) {
  verifyClose(false);
}

TEST_F(
    WebSocketClientCallbackCloseTest,
    CloseFromMessageKeepsThreadForOwnerDestruction) {
  verifyClose(true);
}

} // namespace facebook::react
