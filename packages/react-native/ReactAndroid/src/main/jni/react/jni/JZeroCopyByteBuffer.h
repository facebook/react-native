/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fbjni/ByteBuffer.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <react/jni/JMutableDataBuffer.h>

namespace facebook::react {

// Retains a jsi::MutableBuffer and exposes its memory as a direct ByteBuffer
// view.
class JZeroCopyByteBufferHolder
    : public jni::HybridClass<JZeroCopyByteBufferHolder> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/ZeroCopyByteBufferHolder;";

  struct Wrapped {
    jni::local_ref<jhybridobject> holder;
    jni::local_ref<jni::JByteBuffer> byteBuffer;
  };

  static void registerNatives() {
    registerHybrid({});
  }

  static Wrapped wrapMutableBuffer(std::shared_ptr<jsi::MutableBuffer> buffer) {
    auto byteBuffer = [&]() {
      if (auto* javaBacked = dynamic_cast<JMutableDataBuffer*>(buffer.get())) {
        return javaBacked->getJavaByteBuffer();
      }
      auto* mutableBuffer = holder->cthis()->buffer_.get();
      return jni::JByteBuffer::wrapBytes(
          mutableBuffer->data(), mutableBuffer->size());
    }();
    auto holder = newObjectCxxArgs(std::move(buffer));
    return {
        std::move(holder),
        std::move(byteBuffer),
    };
  }

 private:
  friend HybridBase;

  explicit JZeroCopyByteBufferHolder(
      std::shared_ptr<jsi::MutableBuffer> buffer) noexcept
      : buffer_(std::move(buffer)) {}

  std::shared_ptr<jsi::MutableBuffer> buffer_;
};

} // namespace facebook::react
