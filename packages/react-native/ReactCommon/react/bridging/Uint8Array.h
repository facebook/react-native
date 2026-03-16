/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Base.h>

#include <cmath>
#include <cstring>
#include <limits>
#include <memory>
#include <stdexcept>
#include <vector>

namespace facebook::react {

// Uint8Array supports three backing modes:
// 1) owned bytes (std::vector<uint8_t>)
// 2) native shared storage (jsi::MutableBuffer)
// 3) JS ArrayBuffer-backed borrowed storage (zero-copy fromJs)
//
// JS-backed borrowed storage is only safe to consume on the JS runtime thread.
// If data must outlive the synchronous call boundary or be used cross-thread,
// call toOwned() first to materialize a native copy.
class Uint8Array {
 public:
  Uint8Array() = default;

  explicit Uint8Array(std::vector<uint8_t> bytes)
      : bytes_(std::move(bytes)), byteLength_(bytes_.size()) {}

  Uint8Array(std::initializer_list<uint8_t> bytes)
      : bytes_(bytes), byteLength_(bytes_.size()) {}

  explicit Uint8Array(size_t size) : bytes_(size), byteLength_(bytes_.size()) {}

  Uint8Array(const uint8_t* data, size_t size)
      : bytes_(data, data + size), byteLength_(bytes_.size()) {}

  Uint8Array(const char* data, size_t size)
      : Uint8Array(reinterpret_cast<const uint8_t*>(data), size) {}

  explicit Uint8Array(std::shared_ptr<jsi::MutableBuffer> mutableBuffer)
      : mutableBuffer_(std::move(mutableBuffer)),
        byteOffset_(0),
        byteLength_(mutableBuffer_ ? mutableBuffer_->size() : 0)
  {
  }

  Uint8Array(
      std::shared_ptr<jsi::MutableBuffer> mutableBuffer,
      size_t byteOffset,
      size_t byteLength)
      : mutableBuffer_(std::move(mutableBuffer)),
        byteOffset_(byteOffset),
        byteLength_(byteLength)
  {
    if (!mutableBuffer_) {
      throw std::invalid_argument("Uint8Array mutableBuffer must not be null");
    }
    auto bufferSize = mutableBuffer_->size();
    if (byteOffset_ > bufferSize || byteLength_ > bufferSize - byteOffset_) {
      throw std::invalid_argument("Uint8Array mutableBuffer view is out of range");
    }
  }

  Uint8Array(
      jsi::Runtime& rt,
      jsi::ArrayBuffer arrayBuffer,
      size_t byteOffset,
      size_t byteLength)
      : jsArrayBuffer_(std::make_shared<jsi::ArrayBuffer>(std::move(arrayBuffer))),
        byteOffset_(byteOffset),
        byteLength_(byteLength)
  {
    auto bufferSize = jsArrayBuffer_->size(rt);
    if (byteOffset_ > bufferSize || byteLength_ > bufferSize - byteOffset_) {
      throw std::invalid_argument("Uint8Array JS ArrayBuffer view is out of range");
    }
    jsBorrowedData_ = jsArrayBuffer_->data(rt) + byteOffset_;
  }

  size_t size() const
  {
    return byteLength_;
  }

  bool empty() const
  {
    return byteLength_ == 0;
  }

  uint8_t* data()
  {
    if (mutableBuffer_) {
      return mutableBuffer_->data() + byteOffset_;
    }
    if (jsArrayBuffer_) {
      return jsBorrowedData_;
    }
    return bytes_.data();
  }

  const uint8_t* data() const
  {
    if (mutableBuffer_) {
      return mutableBuffer_->data() + byteOffset_;
    }
    if (jsArrayBuffer_) {
      return jsBorrowedData_;
    }
    return bytes_.data();
  }

  bool isMutableBufferBacked() const
  {
    return static_cast<bool>(mutableBuffer_);
  }

  bool isJsArrayBufferBacked() const
  {
    return static_cast<bool>(jsArrayBuffer_);
  }

  const std::shared_ptr<jsi::MutableBuffer>& mutableBuffer() const
  {
    return mutableBuffer_;
  }

  const std::shared_ptr<jsi::ArrayBuffer>& jsArrayBuffer() const
  {
    return jsArrayBuffer_;
  }

  size_t byteOffset() const
  {
    return byteOffset_;
  }

  Uint8Array toOwned() const
  {
    Uint8Array owned(size());
    if (!empty()) {
      std::memcpy(owned.data(), data(), size());
    }
    return owned;
  }

 private:
  std::vector<uint8_t> bytes_;
  std::shared_ptr<jsi::MutableBuffer> mutableBuffer_;
  std::shared_ptr<jsi::ArrayBuffer> jsArrayBuffer_;
  uint8_t* jsBorrowedData_{nullptr};
  size_t byteOffset_{0};
  size_t byteLength_{0};
};

template <>
struct Bridging<Uint8Array> {
  static Uint8Array fromJs(jsi::Runtime& rt, jsi::Object value)
  {
    auto uint8ArrayConstructor = rt.global().getPropertyAsFunction(rt, "Uint8Array");
    if (!value.instanceOf(rt, uint8ArrayConstructor)) {
      throw jsi::JSError(rt, "Expected Uint8Array");
    }

    auto byteOffsetValue = value.getProperty(rt, "byteOffset").asNumber();
    auto byteLengthValue = value.getProperty(rt, "byteLength").asNumber();
    constexpr auto kMaxSizeTAsDouble =
        static_cast<double>(std::numeric_limits<size_t>::max());
    if (
        !std::isfinite(byteOffsetValue) || !std::isfinite(byteLengthValue) ||
        byteOffsetValue < 0 || std::floor(byteOffsetValue) != byteOffsetValue ||
        byteOffsetValue > kMaxSizeTAsDouble ||
        byteLengthValue < 0 || std::floor(byteLengthValue) != byteLengthValue ||
        byteLengthValue > kMaxSizeTAsDouble) {
      throw jsi::JSError(rt, "Invalid Uint8Array view");
    }

    auto byteOffset = static_cast<size_t>(byteOffsetValue);
    auto byteLength = static_cast<size_t>(byteLengthValue);
    auto arrayBuffer =
        value.getProperty(rt, "buffer").asObject(rt).getArrayBuffer(rt);

    auto bufferSize = arrayBuffer.size(rt);
    if (byteOffset > bufferSize || byteLength > bufferSize - byteOffset) {
      throw jsi::JSError(rt, "Invalid Uint8Array view");
    }

    // Zero-copy from JS: keep a reference to the ArrayBuffer and expose a view.
    return Uint8Array(rt, std::move(arrayBuffer), byteOffset, byteLength);
  }

  static jsi::Object toJs(jsi::Runtime& rt, const Uint8Array& value)
  {
    auto uint8ArrayConstructor =
        rt.global().getPropertyAsFunction(rt, "Uint8Array");

    if (value.isMutableBufferBacked()) {
      auto mutableBuffer = value.mutableBuffer();
      if (!mutableBuffer) {
        throw jsi::JSError(rt, "Invalid Uint8Array mutable buffer");
      }

      auto bufferSize = mutableBuffer->size();
      auto byteOffset = value.byteOffset();
      auto byteLength = value.size();
      if (byteOffset > bufferSize || byteLength > bufferSize - byteOffset) {
        throw jsi::JSError(rt, "Invalid Uint8Array mutable buffer view");
      }

      auto arrayBuffer = jsi::ArrayBuffer(rt, mutableBuffer);
      if (byteOffset == 0 && byteLength == bufferSize) {
        return uint8ArrayConstructor.callAsConstructor(rt, std::move(arrayBuffer))
            .asObject(rt);
      }
      return uint8ArrayConstructor
          .callAsConstructor(
              rt,
              std::move(arrayBuffer),
              static_cast<double>(byteOffset),
              static_cast<double>(byteLength))
          .asObject(rt);
    }

    if (value.isJsArrayBufferBacked()) {
      auto arrayBufferRef = value.jsArrayBuffer();
      if (!arrayBufferRef) {
        throw jsi::JSError(rt, "Invalid Uint8Array JS ArrayBuffer");
      }

      auto arrayBuffer =
          jsi::Value(rt, *arrayBufferRef).asObject(rt).getArrayBuffer(rt);
      auto bufferSize = arrayBuffer.size(rt);
      auto byteOffset = value.byteOffset();
      auto byteLength = value.size();
      if (byteOffset > bufferSize || byteLength > bufferSize - byteOffset) {
        throw jsi::JSError(rt, "Invalid Uint8Array JS ArrayBuffer view");
      }

      if (byteOffset == 0 && byteLength == bufferSize) {
        return uint8ArrayConstructor.callAsConstructor(rt, std::move(arrayBuffer))
            .asObject(rt);
      }
      return uint8ArrayConstructor
          .callAsConstructor(
              rt,
              std::move(arrayBuffer),
              static_cast<double>(byteOffset),
              static_cast<double>(byteLength))
          .asObject(rt);
    }

    auto arrayBufferConstructor =
        rt.global().getPropertyAsFunction(rt, "ArrayBuffer");
    auto arrayBuffer = arrayBufferConstructor
                           .callAsConstructor(rt, static_cast<double>(value.size()))
                           .asObject(rt)
                           .getArrayBuffer(rt);

    if (!value.empty()) {
      std::memcpy(arrayBuffer.data(rt), value.data(), value.size());
    }

    return uint8ArrayConstructor.callAsConstructor(rt, std::move(arrayBuffer))
        .asObject(rt);
  }
};

} // namespace facebook::react
