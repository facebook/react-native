/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Base.h>

#include <cstring>
#include <functional>

namespace facebook::react {

/**
 * A non-owning implementation of jsi::MutableBuffer that borrows a pointer to
 * externally-managed memory. The caller MUST ensure the underlying data outlives
 * the buffer, or provide a release callback that prevents the source from being
 * deallocated (e.g., a JNI global_ref or an ARC-retained ObjC object).
 *
 * When the BorrowedMutableBuffer is destroyed, the optional release callback is
 * invoked, allowing the prevent-GC reference to be dropped.
 *
 * Thread safety: The release callback may be invoked on any thread (typically
 * the JS thread during garbage collection). Callers must ensure the release
 * callback is safe to invoke from any thread. JNI DeleteGlobalRef and ARC
 * release are both thread-safe.
 *
 * The release callback must not throw exceptions. Throwing from the destructor
 * will terminate the process.
 */
class BorrowedMutableBuffer : public jsi::MutableBuffer {
 public:
  BorrowedMutableBuffer(uint8_t *data, size_t size, std::function<void()> release = nullptr)
      : data_(data), size_(size), release_(std::move(release))
  {
  }

  ~BorrowedMutableBuffer() override
  {
    if (release_) {
      release_();
    }
  }

  BorrowedMutableBuffer(const BorrowedMutableBuffer &) = delete;
  BorrowedMutableBuffer &operator=(const BorrowedMutableBuffer &) = delete;
  BorrowedMutableBuffer(BorrowedMutableBuffer &&) = delete;
  BorrowedMutableBuffer &operator=(BorrowedMutableBuffer &&) = delete;

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

} // namespace facebook::react
