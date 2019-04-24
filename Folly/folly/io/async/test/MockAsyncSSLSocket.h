/*
 * Copyright 2015-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#pragma once

#include <folly/io/async/AsyncSSLSocket.h>
#include <folly/portability/GMock.h>

namespace folly {
namespace test {

class MockAsyncSSLSocket : public AsyncSSLSocket {
 public:
  MockAsyncSSLSocket(
      const std::shared_ptr<SSLContext>& ctx,
      EventBase* base,
      bool deferSecurityNegotiation = false)
      : AsyncSocket(base),
        AsyncSSLSocket(ctx, base, deferSecurityNegotiation) {}

  MOCK_METHOD5(
      connect_,
      void(
          AsyncSocket::ConnectCallback*,
          const folly::SocketAddress&,
          int,
          const OptionMap&,
          const folly::SocketAddress&));
  void connect(
      AsyncSocket::ConnectCallback* callback,
      const folly::SocketAddress& address,
      int timeout,
      const OptionMap& options,
      const folly::SocketAddress& bindAddr) noexcept override {
    connect_(callback, address, timeout, options, bindAddr);
  }

  MOCK_CONST_METHOD1(getLocalAddress, void(folly::SocketAddress*));
  MOCK_CONST_METHOD1(getPeerAddress, void(folly::SocketAddress*));
  MOCK_METHOD0(closeNow, void());
  MOCK_CONST_METHOD0(good, bool());
  MOCK_CONST_METHOD0(readable, bool());
  MOCK_CONST_METHOD0(hangup, bool());
  MOCK_CONST_METHOD2(
      getSelectedNextProtocol,
      void(const unsigned char**, unsigned*));
  MOCK_CONST_METHOD2(
      getSelectedNextProtocolNoThrow,
      bool(const unsigned char**, unsigned*));
  MOCK_METHOD1(setReadCB, void(ReadCallback*));

  void sslConn(
      AsyncSSLSocket::HandshakeCB* cb,
      std::chrono::milliseconds timeout,
      const SSLContext::SSLVerifyPeerEnum& verify) override {
    if (timeout > std::chrono::milliseconds::zero()) {
      handshakeTimeout_.scheduleTimeout(timeout);
    }

    state_ = StateEnum::ESTABLISHED;
    sslState_ = STATE_CONNECTING;
    handshakeCallback_ = cb;

    sslConnectMockable(cb, timeout, verify);
  }

  void sslAccept(
      AsyncSSLSocket::HandshakeCB* cb,
      std::chrono::milliseconds timeout,
      const SSLContext::SSLVerifyPeerEnum& verify) override {
    if (timeout > std::chrono::milliseconds::zero()) {
      handshakeTimeout_.scheduleTimeout(timeout);
    }

    state_ = StateEnum::ESTABLISHED;
    sslState_ = STATE_ACCEPTING;
    handshakeCallback_ = cb;

    sslAcceptMockable(cb, timeout, verify);
  }

  MOCK_METHOD3(
      sslConnectMockable,
      void(
          AsyncSSLSocket::HandshakeCB*,
          std::chrono::milliseconds,
          const SSLContext::SSLVerifyPeerEnum&));

  MOCK_METHOD3(
      sslAcceptMockable,
      void(
          AsyncSSLSocket::HandshakeCB*,
          std::chrono::milliseconds,
          const SSLContext::SSLVerifyPeerEnum&));
};

} // namespace test
} // namespace folly
