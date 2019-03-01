/*
 * Copyright 2017 Facebook, Inc.
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
template<class T>
class DecoratedAsyncTransportWrapper : public folly::AsyncTransportWrapper {
 public:
  explicit DecoratedAsyncTransportWrapper(typename T::UniquePtr transport):
    transport_(std::move(transport)) {}

  const AsyncTransportWrapper* getWrappedTransport() const override {
    return transport_.get();
  }

  // folly::AsyncTransportWrapper
  virtual ReadCallback* getReadCallback() const override {
    return transport_->getReadCallback();
  }

  virtual void setReadCB(
      folly::AsyncTransportWrapper::ReadCallback* callback) override {
    transport_->setReadCB(callback);
  }

  virtual void write(
      folly::AsyncTransportWrapper::WriteCallback* callback,
      const void* buf,
      size_t bytes,
      folly::WriteFlags flags = folly::WriteFlags::NONE) override {
    transport_->write(callback, buf, bytes, flags);
  }

  virtual void writeChain(
      folly::AsyncTransportWrapper::WriteCallback* callback,
      std::unique_ptr<folly::IOBuf>&& buf,
      folly::WriteFlags flags = folly::WriteFlags::NONE) override {
    transport_->writeChain(callback, std::move(buf), flags);
  }

  virtual void writev(
      folly::AsyncTransportWrapper::WriteCallback* callback,
      const iovec* vec,
      size_t bytes,
      folly::WriteFlags flags = folly::WriteFlags::NONE) override {
    transport_->writev(callback, vec, bytes, flags);
  }

  // folly::AsyncSocketBase
  virtual folly::EventBase* getEventBase() const override {
    return transport_->getEventBase();
  }

  // folly::AsyncTransport
  virtual void attachEventBase(folly::EventBase* eventBase) override {
    transport_->attachEventBase(eventBase);
  }

  virtual void close() override {
    transport_->close();
  }

  virtual void closeNow() override {
    transport_->closeNow();
  }

  virtual void closeWithReset() override {
    transport_->closeWithReset();

    // This will likely result in 2 closeNow() calls on the decorated transport,
    // but otherwise it is very easy to miss the derived class's closeNow().
    closeNow();
  }

  virtual bool connecting() const override {
    return transport_->connecting();
  }

  virtual void detachEventBase() override {
    transport_->detachEventBase();
  }

  virtual bool error() const override {
    return transport_->error();
  }

  virtual size_t getAppBytesReceived() const override {
    return transport_->getAppBytesReceived();
  }

  virtual size_t getAppBytesWritten() const override {
    return transport_->getAppBytesWritten();
  }

  virtual void getLocalAddress(folly::SocketAddress* address) const override {
    return transport_->getLocalAddress(address);
  }

  virtual void getPeerAddress(folly::SocketAddress* address) const override {
    return transport_->getPeerAddress(address);
  }

  virtual folly::ssl::X509UniquePtr getPeerCert() const override {
    return transport_->getPeerCert();
  }

  virtual size_t getRawBytesReceived() const override {
    return transport_->getRawBytesReceived();
  }

  virtual size_t getRawBytesWritten() const override {
    return transport_->getRawBytesWritten();
  }

  virtual uint32_t getSendTimeout() const override {
    return transport_->getSendTimeout();
  }

  virtual bool good() const override {
    return transport_->good();
  }

  virtual bool isDetachable() const override {
    return transport_->isDetachable();
  }

  virtual bool isEorTrackingEnabled() const override {
    return transport_->isEorTrackingEnabled();
  }

  virtual bool readable() const override {
    return transport_->readable();
  }

  virtual void setEorTracking(bool track) override {
    return transport_->setEorTracking(track);
  }

  virtual void setSendTimeout(uint32_t timeoutInMs) override {
    transport_->setSendTimeout(timeoutInMs);
  }

  virtual void shutdownWrite() override {
    transport_->shutdownWrite();
  }

  virtual void shutdownWriteNow() override {
    transport_->shutdownWriteNow();
  }

  virtual std::string getApplicationProtocol() noexcept override {
    return transport_->getApplicationProtocol();
  }

  virtual std::string getSecurityProtocol() const override {
    return transport_->getSecurityProtocol();
  }

  virtual bool isReplaySafe() const override {
    return transport_->isReplaySafe();
  }

  virtual void setReplaySafetyCallback(
      folly::AsyncTransport::ReplaySafetyCallback* callback) override {
    transport_->setReplaySafetyCallback(callback);
  }

 protected:
  virtual ~DecoratedAsyncTransportWrapper() {}

  typename T::UniquePtr transport_;
};

}
