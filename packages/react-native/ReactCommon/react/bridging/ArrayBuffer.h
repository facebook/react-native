/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Base.h>

#include <cstddef>
#include <cstdint>
#include <cstring>
#include <functional>
#include <utility>
#include <vector>

namespace facebook::react {

/**
 * A non-owning implementation of jsi::MutableBuffer that shares a pointer to
 * externally-managed memory. The caller MUST ensure the underlying data
 * outlives the buffer, or provide a release callback that prevents the source
 * from being deallocated (e.g., a JNI global_ref or an ARC-retained ObjC
 * object).
 *
 * When the SharedMutableBuffer is destroyed, the optional release callback is
 * invoked, allowing the prevent-GC reference to be dropped.
 *
 * Thread safety: The release callback may be invoked on any thread (typically
 * the JS thread during garbage collection). Callers must ensure the release
 * callback is safe to invoke from any thread. JNI DeleteGlobalRef and ARC
 * release are both thread-safe.
 *
 * The release callback must not throw exceptions. Throwing from the destructor
 * will terminate the process.
 *
 * Prefer a concrete platform-specific subclass of jsi::MutableBuffer when one
 * exists (see JByteBufferMutableBuffer on Android, NSMutableDataMutableBuffer
 * on iOS). SharedMutableBuffer is an escape hatch for callers that cannot
 * model their ownership with a dedicated subclass.
 */
class SharedMutableBuffer : public jsi::MutableBuffer {
 public:
  SharedMutableBuffer(uint8_t *data, size_t size, std::function<void()> release = nullptr)
      : data_(data), size_(size), release_(std::move(release))
  {
  }

  ~SharedMutableBuffer() override
  {
    if (release_) {
      release_();
    }
  }

  SharedMutableBuffer(const SharedMutableBuffer &) = delete;
  SharedMutableBuffer &operator=(const SharedMutableBuffer &) = delete;
  SharedMutableBuffer(SharedMutableBuffer &&) = delete;
  SharedMutableBuffer &operator=(SharedMutableBuffer &&) = delete;

  size_t size() const override
  {
    return size_;
  }

  uint8_t *data() override
  {
    return data_;
  }

 private:
  uint8_t *data_;
  size_t size_;
  std::function<void()> release_;
};

/**
 * An owning implementation of jsi::MutableBuffer backed by a std::vector.
 * Use this when the source of the bytes cannot be guaranteed to outlive the
 * buffer (for example, returning data to JS from an asynchronous native call,
 * or copying a JS ArrayBuffer argument before storing it).
 */
class VectorMutableBuffer final : public jsi::MutableBuffer {
 public:
  explicit VectorMutableBuffer(std::vector<uint8_t> data) : data_(std::move(data)) {}

  VectorMutableBuffer(const uint8_t *source, size_t size) : data_(size)
  {
    std::memcpy(data_.data(), source, size);
  }

  size_t size() const override
  {
    return data_.size();
  }

  uint8_t *data() override
  {
    return data_.data();
  }

 private:
  std::vector<uint8_t> data_;
};

} // namespace facebook::react
