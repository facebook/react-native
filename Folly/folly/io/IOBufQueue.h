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

#include <folly/io/IOBuf.h>

#include <stdexcept>
#include <string>

namespace folly {

/**
 * An IOBufQueue encapsulates a chain of IOBufs and provides
 * convenience functions to append data to the back of the chain
 * and remove data from the front.
 *
 * You may also prepend data into the headroom of the first buffer in the
 * chain, if any.
 */
class IOBufQueue {
 public:
  struct Options {
    Options() : cacheChainLength(false) { }
    bool cacheChainLength;
  };

  /**
   * Commonly used Options, currently the only possible value other than
   * the default.
   */
  static Options cacheChainLength() {
    Options options;
    options.cacheChainLength = true;
    return options;
  }

  explicit IOBufQueue(const Options& options = Options());

  /**
   * Return a space to prepend bytes and the amount of headroom available.
   */
  std::pair<void*, uint64_t> headroom();

  /**
   * Indicate that n bytes from the headroom have been used.
   */
  void markPrepended(uint64_t n);

  /**
   * Prepend an existing range; throws std::overflow_error if not enough
   * room.
   */
  void prepend(const void* buf, uint64_t n);

  /**
   * Add a buffer or buffer chain to the end of this queue. The
   * queue takes ownership of buf.
   *
   * If pack is true, we try to reduce wastage at the end of this queue
   * by copying some data from the first buffers in the buf chain (and
   * releasing the buffers), if possible.  If pack is false, we leave
   * the chain topology unchanged.
   */
  void append(std::unique_ptr<folly::IOBuf>&& buf,
              bool pack=false);

  /**
   * Add a queue to the end of this queue. The queue takes ownership of
   * all buffers from the other queue.
   */
  void append(IOBufQueue& other, bool pack=false);
  void append(IOBufQueue&& other, bool pack=false) {
    append(other, pack);  // call lvalue reference overload, above
  }

  /**
   * Copy len bytes, starting at buf, to the end of this queue.
   * The caller retains ownership of the source data.
   */
  void append(const void* buf, size_t len);

  /**
   * Copy a string to the end of this queue.
   * The caller retains ownership of the source data.
   */
  void append(StringPiece sp) {
    append(sp.data(), sp.size());
  }

  /**
   * Append a chain of IOBuf objects that point to consecutive regions
   * within buf.
   *
   * Just like IOBuf::wrapBuffer, this should only be used when the caller
   * knows ahead of time and can ensure that all IOBuf objects that will point
   * to this buffer will be destroyed before the buffer itself is destroyed;
   * all other caveats from wrapBuffer also apply.
   *
   * Every buffer except for the last will wrap exactly blockSize bytes.
   * Importantly, this method may be used to wrap buffers larger than 4GB.
   */
  void wrapBuffer(const void* buf, size_t len,
                  uint64_t blockSize=(1U << 31));  // default block size: 2GB

  /**
   * Obtain a writable block of contiguous bytes at the end of this
   * queue, allocating more space if necessary.  The amount of space
   * reserved will be at least min.  If min contiguous space is not
   * available at the end of the queue, and IOBuf with size newAllocationSize
   * is appended to the chain and returned.  The actual available space
   * may be larger than newAllocationSize, but will be truncated to max,
   * if specified.
   *
   * If the caller subsequently writes anything into the returned space,
   * it must call the postallocate() method.
   *
   * @return The starting address of the block and the length in bytes.
   *
   * @note The point of the preallocate()/postallocate() mechanism is
   *       to support I/O APIs such as Thrift's TAsyncSocket::ReadCallback
   *       that request a buffer from the application and then, in a later
   *       callback, tell the application how much of the buffer they've
   *       filled with data.
   */
  std::pair<void*,uint64_t> preallocate(
    uint64_t min, uint64_t newAllocationSize,
    uint64_t max = std::numeric_limits<uint64_t>::max()) {
    auto buf = tailBuf();
    if (LIKELY(buf && buf->tailroom() >= min)) {
      return std::make_pair(buf->writableTail(),
                            std::min(max, buf->tailroom()));
    }

    return preallocateSlow(min, newAllocationSize, max);
  }

  /**
   * Tell the queue that the caller has written data into the first n
   * bytes provided by the previous preallocate() call.
   *
   * @note n should be less than or equal to the size returned by
   *       preallocate().  If n is zero, the caller may skip the call
   *       to postallocate().  If n is nonzero, the caller must not
   *       invoke any other non-const methods on this IOBufQueue between
   *       the call to preallocate and the call to postallocate().
   */
  void postallocate(uint64_t n) {
    head_->prev()->append(n);
    chainLength_ += n;
  }

  /**
   * Obtain a writable block of n contiguous bytes, allocating more space
   * if necessary, and mark it as used.  The caller can fill it later.
   */
  void* allocate(uint64_t n) {
    void* p = preallocate(n, n).first;
    postallocate(n);
    return p;
  }

  void* writableTail() const {
    auto buf = tailBuf();
    return buf ? buf->writableTail() : nullptr;
  }

  size_t tailroom() const {
    auto buf = tailBuf();
    return buf ? buf->tailroom() : 0;
  }

  /**
   * Split off the first n bytes of the queue into a separate IOBuf chain,
   * and transfer ownership of the new chain to the caller.  The IOBufQueue
   * retains ownership of everything after the split point.
   *
   * @warning If the split point lies in the middle of some IOBuf within
   *          the chain, this function may, as an implementation detail,
   *          clone that IOBuf.
   *
   * @throws std::underflow_error if n exceeds the number of bytes
   *         in the queue.
   */
  std::unique_ptr<folly::IOBuf> split(size_t n) {
    return split(n, true);
  }

  /**
   * Similar to split, but will return the entire queue instead of throwing
   * if n exceeds the number of bytes in the queue.
   */
  std::unique_ptr<folly::IOBuf> splitAtMost(size_t n) {
    return split(n, false);
  }

  /**
   * Similar to IOBuf::trimStart, but works on the whole queue.  Will
   * pop off buffers that have been completely trimmed.
   */
  void trimStart(size_t amount);

  /**
   * Similar to IOBuf::trimEnd, but works on the whole queue.  Will
   * pop off buffers that have been completely trimmed.
   */
  void trimEnd(size_t amount);

  /**
   * Transfer ownership of the queue's entire IOBuf chain to the caller.
   */
  std::unique_ptr<folly::IOBuf> move() {
    chainLength_ = 0;
    return std::move(head_);
  }

  /**
   * Access
   */
  const folly::IOBuf* front() const {
    return head_.get();
  }

  /**
   * returns the first IOBuf in the chain and removes it from the chain
   *
   * @return first IOBuf in the chain or nullptr if none.
   */
  std::unique_ptr<folly::IOBuf> pop_front();

  /**
   * Total chain length, only valid if cacheLength was specified in the
   * constructor.
   */
  size_t chainLength() const {
    if (UNLIKELY(!options_.cacheChainLength)) {
      throw std::invalid_argument("IOBufQueue: chain length not cached");
    }
    return chainLength_;
  }

  /**
   * Returns true iff the IOBuf chain length is 0.
   */
  bool empty() const {
    return !head_ || head_->empty();
  }

  const Options& options() const {
    return options_;
  }

  /**
   * Clear the queue.  Note that this does not release the buffers, it
   * just sets their length to zero; useful if you want to reuse the
   * same queue without reallocating.
   */
  void clear();

  /**
   * Append the queue to a std::string. Non-destructive.
   */
  void appendToString(std::string& out) const;

  /**
   * Calls IOBuf::gather() on the head of the queue, if it exists.
   */
  void gather(uint64_t maxLength);

  /** Movable */
  IOBufQueue(IOBufQueue&&) noexcept;
  IOBufQueue& operator=(IOBufQueue&&);

 private:
  IOBuf* tailBuf() const {
    if (UNLIKELY(!head_)) return nullptr;
    IOBuf* buf = head_->prev();
    return LIKELY(!buf->isSharedOne()) ? buf : nullptr;
  }
  std::pair<void*,uint64_t> preallocateSlow(
    uint64_t min, uint64_t newAllocationSize, uint64_t max);

  std::unique_ptr<folly::IOBuf> split(size_t n, bool throwOnUnderflow);

  static const size_t kChainLengthNotCached = (size_t)-1;
  /** Not copyable */
  IOBufQueue(const IOBufQueue&) = delete;
  IOBufQueue& operator=(const IOBufQueue&) = delete;

  Options options_;

  // NOTE that chainLength_ is still updated even if !options_.cacheChainLength
  // because doing it unchecked in postallocate() is faster (no (mis)predicted
  // branch)
  size_t chainLength_;
  /** Everything that has been appended but not yet discarded or moved out */
  std::unique_ptr<folly::IOBuf> head_;
};

} // folly
