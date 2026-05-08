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

// Holds ArrayBuffer bytes for use off the JS thread. Move-only.
//
// Stores either a native-backed MutableBuffer or an owned copy.
// May outlive the TurboModule call and be transferred across threads.
// Thread synchronization must be enforced externally.
class AsyncArrayBuffer {
 public:
  AsyncArrayBuffer(const AsyncArrayBuffer&) = delete;
  AsyncArrayBuffer& operator=(const AsyncArrayBuffer&) = delete;
  AsyncArrayBuffer(AsyncArrayBuffer&&) noexcept = default;
  AsyncArrayBuffer& operator=(AsyncArrayBuffer&&) noexcept = default;
  ~AsyncArrayBuffer() = default;

  // Zero-copy if native-backed, copies otherwise.
  static AsyncArrayBuffer acquire(
      jsi::Runtime& rt,
      const jsi::ArrayBuffer& buffer) {
    if (buffer.detached(rt)) {
      throw jsi::JSError(
          rt, "AsyncArrayBuffer::acquire: ArrayBuffer is detached");
    }
    auto mutableBuf = buffer.tryGetMutableBuffer(rt);
    if (mutableBuf) {
      return AsyncArrayBuffer(std::move(mutableBuf));
    }
    auto n = buffer.size(rt);
    auto src = buffer.data(rt);
    return AsyncArrayBuffer(std::vector<uint8_t>(src, src + n));
  }

  // Zero-copy. Throws if not native-backed.
  static AsyncArrayBuffer borrow(
      jsi::Runtime& rt,
      const jsi::ArrayBuffer& buffer) {
    if (buffer.detached(rt)) {
      throw jsi::JSError(
          rt, "AsyncArrayBuffer::borrow: ArrayBuffer is detached");
    }
    auto mutableBuf = buffer.tryGetMutableBuffer(rt);
    if (!mutableBuf) {
      throw jsi::JSError(
          rt,
          "AsyncArrayBuffer::borrow: ArrayBuffer is not native-backed. "
          "Use AsyncArrayBuffer::acquire(rt, buffer) when the buffer origin is unknown.");
    }
    return AsyncArrayBuffer(std::move(mutableBuf));
  }

  // Always copies.
  static AsyncArrayBuffer copy(
      jsi::Runtime& rt,
      const jsi::ArrayBuffer& buffer) {
    if (buffer.detached(rt)) {
      throw jsi::JSError(rt, "AsyncArrayBuffer::copy: ArrayBuffer is detached");
    }
    auto src = buffer.data(rt);
    auto n = buffer.size(rt);
    return AsyncArrayBuffer(std::vector<uint8_t>(src, src + n));
  }

  // Wraps a native MutableBuffer. Safe to call from any thread.
  static AsyncArrayBuffer wrap(
      std::shared_ptr<jsi::MutableBuffer> buffer) noexcept {
    return AsyncArrayBuffer(std::move(buffer));
  }

  // Takes ownership of a byte vector. Safe to call from any thread.
  static AsyncArrayBuffer wrap(std::vector<uint8_t> bytes) noexcept {
    return AsyncArrayBuffer(std::move(bytes));
  }

  bool isNativeBacked() const noexcept {
    return mutableBuffer_ != nullptr;
  }

  uint8_t* data() noexcept {
    return mutableBuffer_ ? mutableBuffer_->data() : ownedCopy_.data();
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
  explicit AsyncArrayBuffer(std::shared_ptr<jsi::MutableBuffer> buffer) noexcept
      : mutableBuffer_{std::move(buffer)} {}

  explicit AsyncArrayBuffer(std::vector<uint8_t> bytes) noexcept
      : ownedCopy_{std::move(bytes)} {}

  std::shared_ptr<jsi::MutableBuffer> mutableBuffer_;
  std::vector<uint8_t> ownedCopy_;
};

template <>
struct Bridging<AsyncArrayBuffer> {
  static jsi::Value toJs(jsi::Runtime& rt, AsyncArrayBuffer buffer) {
    if (auto mutableBuf = buffer.getMutableBuffer()) {
      return jsi::Value(rt, rt.createArrayBuffer(std::move(mutableBuf)));
    }
    struct OwnedBuffer final : jsi::MutableBuffer {
      explicit OwnedBuffer(AsyncArrayBuffer b) noexcept : buf_(std::move(b)) {}
      size_t size() const override {
        return buf_.size();
      }
      uint8_t* data() override {
        return buf_.data();
      }
      AsyncArrayBuffer buf_;
    };
    auto owned = std::make_shared<OwnedBuffer>(std::move(buffer));
    return jsi::Value(rt, rt.createArrayBuffer(std::move(owned)));
  }
};

} // namespace facebook::react
