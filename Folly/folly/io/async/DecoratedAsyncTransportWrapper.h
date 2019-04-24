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

#include <folly/io/async/AsyncTransport.h>

namespace folly {

/**
 * Convenience class so that AsyncTransportWrapper can be decorated without
 * having to redefine every single method.
 */
template <class T>
class DecoratedAsyncTransportWrapper : public folly::AsyncTransportWrapper {
 public:
  explicit DecoratedAsyncTransportWrapper(typename T::UniquePtr transport)
      : transport_(std::move(transport)) {}

  const AsyncTransportWrapper* getWrappedTransport() const override {
    return transport_.get();
  }

  // folly::AsyncTransportWrapper
  ReadCallback* getReadCallback() const override {
    return transport_->getReadCallback();
  }

  void setReadCB(
      folly::AsyncTransportWrapper::ReadCallback* callback) override {
    transport_->setReadCB(callback);
  }

  void write(
      folly::AsyncTransportWrapper::WriteCallback* callback,
      const void* buf,
      size_t bytes,
      folly::WriteFlags flags = folly::WriteFlags::NONE) override {
    transport_->write(callback, buf, bytes, flags);
  }

  void writeChain(
      folly::AsyncTransportWrapper::WriteCallback* callback,
      std::unique_ptr<folly::IOBuf>&& buf,
      folly::WriteFlags flags = folly::WriteFlags::NONE) override {
    transport_->writeChain(callback, std::move(buf), flags);
  }

  void writev(
      folly::AsyncTransportWrapper::WriteCallback* callback,
      const iovec* vec,
      size_t bytes,
      folly::WriteFlags flags = folly::WriteFlags::NONE) override {
    transport_->writev(callback, vec, bytes, flags);
  }

  // folly::AsyncSocketBase
  folly::EventBase* getEventBase() const override {
    return transport_->getEventBase();
  }

  // folly::AsyncTransport
  void attachEventBase(folly::EventBase* eventBase) override {
    transport_->attachEventBase(eventBase);
  }

  void close() override {
    transport_->close();
  }

  void closeNow() override {
    transport_->closeNow();
  }

  void closeWithReset() override {
    transport_->closeWithReset();

    // This will likely result in 2 closeNow() calls on the decorated transport,
    // but otherwise it is very easy to miss the derived class's closeNow().
    closeNow();
  }

  bool connecting() const override {
    return transport_->connecting();
  }

  void detachEventBase() override {
    transport_->detachEventBase();
  }

  bool error() const override {
    return transport_->error();
  }

  size_t getAppBytesReceived() const override {
    return transport_->getAppBytesReceived();
  }

  size_t getAppBytesWritten() const override {
    return transport_->getAppBytesWritten();
  }

  void getLocalAddress(folly::SocketAddress* address) const override {
    return transport_->getLocalAddress(address);
  }

  void getPeerAddress(folly::SocketAddress* address) const override {
    return transport_->getPeerAddress(address);
  }

  folly::ssl::X509UniquePtr getPeerCert() const override {
    return transport_->getPeerCert();
  }

  size_t getRawBytesReceived() const override {
    return transport_->getRawBytesReceived();
  }

  size_t getRawBytesWritten() const override {
    return transport_->getRawBytesWritten();
  }

  uint32_t getSendTimeout() const override {
    return transport_->getSendTimeout();
  }

  bool good() const override {
    return transport_->good();
  }

  bool isDetachable() const override {
    return transport_->isDetachable();
  }

  bool isEorTrackingEnabled() const override {
    return transport_->isEorTrackingEnabled();
  }

  bool readable() const override {
    return transport_->readable();
  }

  bool writable() const override {
    return transport_->writable();
  }

  void setEorTracking(bool track) override {
    return transport_->setEorTracking(track);
  }

  void setSendTimeout(uint32_t timeoutInMs) override {
    transport_->setSendTimeout(timeoutInMs);
  }

  void shutdownWrite() override {
    transport_->shutdownWrite();
  }

  void shutdownWriteNow() override {
    transport_->shutdownWriteNow();
  }

  std::string getApplicationProtocol() const noexcept override {
    return transport_->getApplicationProtocol();
  }

  std::string getSecurityProtocol() const override {
    return transport_->getSecurityProtocol();
  }

  bool isReplaySafe() const override {
    return transport_->isReplaySafe();
  }

  void setReplaySafetyCallback(
      folly::AsyncTransport::ReplaySafetyCallback* callback) override {
    transport_->setReplaySafetyCallback(callback);
  }

  const AsyncTransportCertificate* getPeerCertificate() const override {
    return transport_->getPeerCertificate();
  }

  const AsyncTransportCertificate* getSelfCertificate() const override {
    return transport_->getSelfCertificate();
  }

 protected:
  ~DecoratedAsyncTransportWrapper() override {}

  typename T::UniquePtr transport_;
};

} // namespace folly
