/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Base.h>

namespace facebook::react {

template <>
struct Bridging<jsi::ArrayBuffer> {
  static jsi::ArrayBuffer fromJs(jsi::Runtime& rt, const jsi::Object& obj) {
    if (!obj.isArrayBuffer(rt)) {
      throw jsi::JSError(rt, "Expected ArrayBuffer");
    }
    return obj.getArrayBuffer(rt);
  }

  static jsi::Value toJs(jsi::Runtime& rt, jsi::ArrayBuffer buf) {
    return jsi::Value(rt, std::move(buf));
  }
};

// Buffer that safely outlives a synchronous TurboModule call and may be
// accessed from any thread. Must be constructed on the JS thread.
// Constructor auto-detects backing (zero-copy if native-backed, copy
// otherwise). Use borrow() for an explicit zero-copy guarantee, copy() to
// always copy.
class SafeAsyncArrayBuffer {
 public:
  SafeAsyncArrayBuffer(const SafeAsyncArrayBuffer&) = delete;
  SafeAsyncArrayBuffer& operator=(const SafeAsyncArrayBuffer&) = delete;
  SafeAsyncArrayBuffer(SafeAsyncArrayBuffer&&) noexcept = default;
  SafeAsyncArrayBuffer& operator=(SafeAsyncArrayBuffer&&) noexcept = default;
  ~SafeAsyncArrayBuffer() = default;

  // Recommended: zero-copy if native-backed, copies otherwise.
  SafeAsyncArrayBuffer(jsi::Runtime& rt, const jsi::ArrayBuffer& buffer) {
    if (buffer.detached(rt)) {
      throw jsi::JSError(rt, "SafeAsyncArrayBuffer: ArrayBuffer is detached");
    }
    size_ = buffer.size(rt);
    auto mutableBuf = buffer.tryGetMutableBuffer(rt);
    if (mutableBuf) {
      mutableBuffer_ = std::move(mutableBuf);
    } else {
      auto src = buffer.data(rt);
      ownedCopy_ = std::vector<uint8_t>(src, src + size_);
    }
  }

  // Zero-copy. Throws if buffer is not native-backed.
  static SafeAsyncArrayBuffer borrow(
      jsi::Runtime& rt,
      const jsi::ArrayBuffer& buffer) {
    if (buffer.detached(rt)) {
      throw jsi::JSError(
          rt, "SafeAsyncArrayBuffer::borrow: ArrayBuffer is detached");
    }
    auto mutableBuf = buffer.tryGetMutableBuffer(rt);
    if (!mutableBuf) {
      throw jsi::JSError(
          rt,
          "SafeAsyncArrayBuffer::borrow: ArrayBuffer is not native-backed. "
          "Use SafeAsyncArrayBuffer(rt, buf) when the buffer origin is unknown.");
    }
    return SafeAsyncArrayBuffer(std::move(mutableBuf), buffer.size(rt));
  }

  // Always copies. Valid for any ArrayBuffer.
  static SafeAsyncArrayBuffer copy(
      jsi::Runtime& rt,
      const jsi::ArrayBuffer& buffer) {
    if (buffer.detached(rt)) {
      throw jsi::JSError(
          rt, "SafeAsyncArrayBuffer::copy: ArrayBuffer is detached");
    }
    auto src = buffer.data(rt);
    auto n = buffer.size(rt);
    return SafeAsyncArrayBuffer(std::vector<uint8_t>(src, src + n), n);
  }

  bool isNativeBacked() const noexcept {
    return mutableBuffer_ != nullptr;
  }

  const uint8_t* data() const noexcept {
    return mutableBuffer_ ? mutableBuffer_->data() : ownedCopy_.data();
  }

  size_t size() const noexcept {
    return size_;
  }

  std::shared_ptr<jsi::MutableBuffer> getMutableBuffer() const noexcept {
    return mutableBuffer_;
  }

 private:
  explicit SafeAsyncArrayBuffer(
      std::shared_ptr<jsi::MutableBuffer> buf,
      size_t n) noexcept
      : mutableBuffer_{std::move(buf)}, size_{n} {}

  explicit SafeAsyncArrayBuffer(std::vector<uint8_t> bytes, size_t n) noexcept
      : ownedCopy_{std::move(bytes)}, size_{n} {}

  std::shared_ptr<jsi::MutableBuffer> mutableBuffer_;
  std::vector<uint8_t> ownedCopy_;
  size_t size_{0};
};

} // namespace facebook::react
