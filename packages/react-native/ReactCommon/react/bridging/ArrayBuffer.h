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

// Holds ArrayBuffer data for use off the JS thread. Move-only.
class SafeAsyncArrayBuffer {
 public:
  SafeAsyncArrayBuffer(const SafeAsyncArrayBuffer&) = delete;
  SafeAsyncArrayBuffer& operator=(const SafeAsyncArrayBuffer&) = delete;
  SafeAsyncArrayBuffer(SafeAsyncArrayBuffer&&) noexcept = default;
  SafeAsyncArrayBuffer& operator=(SafeAsyncArrayBuffer&&) noexcept = default;
  ~SafeAsyncArrayBuffer() = default;

  // Zero-copy if native-backed, copies otherwise.
  static SafeAsyncArrayBuffer acquire(
      jsi::Runtime& rt,
      const jsi::ArrayBuffer& buffer) {
    if (buffer.detached(rt)) {
      throw jsi::JSError(
          rt, "SafeAsyncArrayBuffer::acquire: ArrayBuffer is detached");
    }
    auto mutableBuf = buffer.tryGetMutableBuffer(rt);
    if (mutableBuf) {
      return SafeAsyncArrayBuffer(std::move(mutableBuf));
    }
    auto n = buffer.size(rt);
    auto src = buffer.data(rt);
    return SafeAsyncArrayBuffer(std::vector<uint8_t>(src, src + n));
  }

  // Zero-copy. Throws if not native-backed.
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
          "Use SafeAsyncArrayBuffer::acquire(rt, buffer) when the buffer origin is unknown.");
    }
    return SafeAsyncArrayBuffer(std::move(mutableBuf));
  }

  // Always copies.
  static SafeAsyncArrayBuffer copy(
      jsi::Runtime& rt,
      const jsi::ArrayBuffer& buffer) {
    if (buffer.detached(rt)) {
      throw jsi::JSError(
          rt, "SafeAsyncArrayBuffer::copy: ArrayBuffer is detached");
    }
    auto src = buffer.data(rt);
    auto n = buffer.size(rt);
    return SafeAsyncArrayBuffer(std::vector<uint8_t>(src, src + n));
  }

  // Wraps a native MutableBuffer. Safe to call from any thread.
  static SafeAsyncArrayBuffer wrap(
      std::shared_ptr<jsi::MutableBuffer> buffer) noexcept {
    return SafeAsyncArrayBuffer(std::move(buffer));
  }

  // Takes ownership of a byte vector. Safe to call from any thread.
  static SafeAsyncArrayBuffer wrap(std::vector<uint8_t> bytes) noexcept {
    return SafeAsyncArrayBuffer(std::move(bytes));
  }

  bool isNativeBacked() const noexcept {
    return mutableBuffer_ != nullptr;
  }

  const uint8_t* data() const noexcept {
    return mutableBuffer_ ? mutableBuffer_->data() : ownedCopy_.data();
  }

  size_t size() const noexcept {
    return mutableBuffer_ ? mutableBuffer_->size() : ownedCopy_.size();
  }

  std::shared_ptr<jsi::MutableBuffer> getMutableBuffer() const noexcept {
    return mutableBuffer_;
  }

 private:
  explicit SafeAsyncArrayBuffer(
      std::shared_ptr<jsi::MutableBuffer> buffer) noexcept
      : mutableBuffer_{std::move(buffer)} {}

  explicit SafeAsyncArrayBuffer(std::vector<uint8_t> bytes) noexcept
      : ownedCopy_{std::move(bytes)} {}

  std::shared_ptr<jsi::MutableBuffer> mutableBuffer_;
  std::vector<uint8_t> ownedCopy_;
};

template <>
struct Bridging<SafeAsyncArrayBuffer> {
  static jsi::Value toJs(jsi::Runtime& rt, SafeAsyncArrayBuffer buffer) {
    if (auto mutableBuf = buffer.getMutableBuffer()) {
      return jsi::Value(rt, rt.createArrayBuffer(std::move(mutableBuf)));
    }
    struct OwnedBuffer final : jsi::MutableBuffer {
      explicit OwnedBuffer(SafeAsyncArrayBuffer b) noexcept
          : buf_(std::move(b)) {}
      size_t size() const override {
        return buf_.size();
      }
      uint8_t* data() override {
        return const_cast<uint8_t*>(buf_.data());
      }
      SafeAsyncArrayBuffer buf_;
    };
    auto owned = std::make_shared<OwnedBuffer>(std::move(buffer));
    return jsi::Value(rt, rt.createArrayBuffer(std::move(owned)));
  }
};

} // namespace facebook::react
