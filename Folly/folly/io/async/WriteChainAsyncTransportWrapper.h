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

#include <folly/io/IOBuf.h>
#include <folly/io/async/AsyncTransport.h>
#include <folly/io/async/DecoratedAsyncTransportWrapper.h>

namespace folly {

/**
 * Helper class that redirects write() and writev() calls to writeChain().
 */
template <class T>
class WriteChainAsyncTransportWrapper
    : public DecoratedAsyncTransportWrapper<T> {
 public:
  using DecoratedAsyncTransportWrapper<T>::DecoratedAsyncTransportWrapper;

  void write(
      folly::AsyncTransportWrapper::WriteCallback* callback,
      const void* buf,
      size_t bytes,
      folly::WriteFlags flags = folly::WriteFlags::NONE) override {
    auto ioBuf = folly::IOBuf::wrapBuffer(buf, bytes);
    writeChain(callback, std::move(ioBuf), flags);
  }

  void writev(
      folly::AsyncTransportWrapper::WriteCallback* callback,
      const iovec* vec,
      size_t count,
      folly::WriteFlags flags = folly::WriteFlags::NONE) override {
    auto writeBuffer = folly::IOBuf::wrapIov(vec, count);
    writeChain(callback, std::move(writeBuffer), flags);
  }

  /**
   * It only makes sense to use this class if you override writeChain, so force
   * derived classes to do that.
   */
  void writeChain(
      folly::AsyncTransportWrapper::WriteCallback* callback,
      std::unique_ptr<folly::IOBuf>&& buf,
      folly::WriteFlags flags = folly::WriteFlags::NONE) override = 0;
};

} // namespace folly
