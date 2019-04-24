/*
 * Copyright 2013-present Facebook, Inc.
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

#include <glog/logging.h>
#include <atomic>
#include <cassert>
#include <cinttypes>
#include <cstddef>
#include <cstring>
#include <iterator>
#include <limits>
#include <memory>
#include <type_traits>

#include <folly/FBString.h>
#include <folly/FBVector.h>
#include <folly/Portability.h>
#include <folly/Range.h>
#include <folly/detail/Iterators.h>
#include <folly/lang/Ordering.h>
#include <folly/portability/SysUio.h>

// Ignore shadowing warnings within this file, so includers can use -Wshadow.
FOLLY_PUSH_WARNING
FOLLY_GNU_DISABLE_WARNING("-Wshadow")

namespace folly {

/**
 * An IOBuf is a pointer to a buffer of data.
 *
 * IOBuf objects are intended to be used primarily for networking code, and are
 * modelled somewhat after FreeBSD's mbuf data structure, and Linux's sk_buff
 * structure.
 *
 * IOBuf objects facilitate zero-copy network programming, by allowing multiple
 * IOBuf objects to point to the same underlying buffer of data, using a
 * reference count to track when the buffer is no longer needed and can be
 * freed.
 *
 *
 * Data Layout
 * -----------
 *
 * The IOBuf itself is a small object containing a pointer to the buffer and
 * information about which segment of the buffer contains valid data.
 *
 * The data layout looks like this:
 *
 *  +-------+
 *  | IOBuf |
 *  +-------+
 *   /
 *  |
 *  v
 *  +------------+--------------------+-----------+
 *  | headroom   |        data        |  tailroom |
 *  +------------+--------------------+-----------+
 *  ^            ^                    ^           ^
 *  buffer()   data()               tail()      bufferEnd()
 *
 *  The length() method returns the length of the valid data; capacity()
 *  returns the entire capacity of the buffer (from buffer() to bufferEnd()).
 *  The headroom() and tailroom() methods return the amount of unused capacity
 *  available before and after the data.
 *
 *
 * Buffer Sharing
 * --------------
 *
 * The buffer itself is reference counted, and multiple IOBuf objects may point
 * to the same buffer.  Each IOBuf may point to a different section of valid
 * data within the underlying buffer.  For example, if multiple protocol
 * requests are read from the network into a single buffer, a separate IOBuf
 * may be created for each request, all sharing the same underlying buffer.
 *
 * In other words, when multiple IOBufs share the same underlying buffer, the
 * data() and tail() methods on each IOBuf may point to a different segment of
 * the data.  However, the buffer() and bufferEnd() methods will point to the
 * same location for all IOBufs sharing the same underlying buffer.
 *
 *       +-----------+     +---------+
 *       |  IOBuf 1  |     | IOBuf 2 |
 *       +-----------+     +---------+
 *        |         | _____/        |
 *   data |    tail |/    data      | tail
 *        v         v               v
 *  +-------------------------------------+
 *  |     |         |               |     |
 *  +-------------------------------------+
 *
 * If you only read data from an IOBuf, you don't need to worry about other
 * IOBuf objects possibly sharing the same underlying buffer.  However, if you
 * ever write to the buffer you need to first ensure that no other IOBufs point
 * to the same buffer.  The unshare() method may be used to ensure that you
 * have an unshared buffer.
 *
 *
 * IOBuf Chains
 * ------------
 *
 * IOBuf objects also contain pointers to next and previous IOBuf objects.
 * This can be used to represent a single logical piece of data that its stored
 * in non-contiguous chunks in separate buffers.
 *
 * A single IOBuf object can only belong to one chain at a time.
 *
 * IOBuf chains are always circular.  The "prev" pointer in the head of the
 * chain points to the tail of the chain.  However, it is up to the user to
 * decide which IOBuf is the head.  Internally the IOBuf code does not care
 * which element is the head.
 *
 * The lifetime of all IOBufs in the chain are linked: when one element in the
 * chain is deleted, all other chained elements are also deleted.  Conceptually
 * it is simplest to treat this as if the head of the chain owns all other
 * IOBufs in the chain.  When you delete the head of the chain, it will delete
 * the other elements as well.  For this reason, prependChain() and
 * appendChain() take ownership of of the new elements being added to this
 * chain.
 *
 * When the coalesce() method is used to coalesce an entire IOBuf chain into a
 * single IOBuf, all other IOBufs in the chain are eliminated and automatically
 * deleted.  The unshare() method may coalesce the chain; if it does it will
 * similarly delete all IOBufs eliminated from the chain.
 *
 * As discussed in the following section, it is up to the user to maintain a
 * lock around the entire IOBuf chain if multiple threads need to access the
 * chain.  IOBuf does not provide any internal locking.
 *
 *
 * Synchronization
 * ---------------
 *
 * When used in multithread programs, a single IOBuf object should only be used
 * in a single thread at a time.  If a caller uses a single IOBuf across
 * multiple threads the caller is responsible for using an external lock to
 * synchronize access to the IOBuf.
 *
 * Two separate IOBuf objects may be accessed concurrently in separate threads
 * without locking, even if they point to the same underlying buffer.  The
 * buffer reference count is always accessed atomically, and no other
 * operations should affect other IOBufs that point to the same data segment.
 * The caller is responsible for using unshare() to ensure that the data buffer
 * is not shared by other IOBufs before writing to it, and this ensures that
 * the data itself is not modified in one thread while also being accessed from
 * another thread.
 *
 * For IOBuf chains, no two IOBufs in the same chain should be accessed
 * simultaneously in separate threads.  The caller must maintain a lock around
 * the entire chain if the chain, or individual IOBufs in the chain, may be
 * accessed by multiple threads.
 *
 *
 * IOBuf Object Allocation
 * -----------------------
 *
 * IOBuf objects themselves exist separately from the data buffer they point
 * to.  Therefore one must also consider how to allocate and manage the IOBuf
 * objects.
 *
 * It is more common to allocate IOBuf objects on the heap, using the create(),
 * takeOwnership(), or wrapBuffer() factory functions.  The clone()/cloneOne()
 * functions also return new heap-allocated IOBufs.  The createCombined()
 * function allocates the IOBuf object and data storage space together, in a
 * single memory allocation.  This can improve performance, particularly if you
 * know that the data buffer and the IOBuf itself will have similar lifetimes.
 *
 * That said, it is also possible to allocate IOBufs on the stack or inline
 * inside another object as well.  This is useful for cases where the IOBuf is
 * short-lived, or when the overhead of allocating the IOBuf on the heap is
 * undesirable.
 *
 * However, note that stack-allocated IOBufs may only be used as the head of a
 * chain (or standalone as the only IOBuf in a chain).  All non-head members of
 * an IOBuf chain must be heap allocated.  (All functions to add nodes to a
 * chain require a std::unique_ptr<IOBuf>, which enforces this requrement.)
 *
 * Copying IOBufs is only meaningful for the head of a chain. The entire chain
 * is cloned; the IOBufs will become shared, and the old and new IOBufs will
 * refer to the same underlying memory.
 *
 * IOBuf Sharing
 * -------------
 *
 * The IOBuf class manages sharing of the underlying buffer that it points to,
 * maintaining a reference count if multiple IOBufs are pointing at the same
 * buffer.
 *
 * However, it is the callers responsibility to manage sharing and ownership of
 * IOBuf objects themselves.  The IOBuf structure does not provide room for an
 * intrusive refcount on the IOBuf object itself, only the underlying data
 * buffer is reference counted.  If users want to share the same IOBuf object
 * between multiple parts of the code, they are responsible for managing this
 * sharing on their own.  (For example, by using a shared_ptr.  Alternatively,
 * users always have the option of using clone() to create a second IOBuf that
 * points to the same underlying buffer.)
 */
namespace detail {
// Is T a unique_ptr<> to a standard-layout type?
template <typename T>
struct IsUniquePtrToSL : std::false_type {};
template <typename T, typename D>
struct IsUniquePtrToSL<std::unique_ptr<T, D>> : std::is_standard_layout<T> {};
} // namespace detail

class IOBuf {
 public:
  class Iterator;

  enum CreateOp { CREATE };
  enum WrapBufferOp { WRAP_BUFFER };
  enum TakeOwnershipOp { TAKE_OWNERSHIP };
  enum CopyBufferOp { COPY_BUFFER };

  typedef ByteRange value_type;
  typedef Iterator iterator;
  typedef Iterator const_iterator;

  typedef void (*FreeFunction)(void* buf, void* userData);

  /**
   * Allocate a new IOBuf object with the requested capacity.
   *
   * Returns a new IOBuf object that must be (eventually) deleted by the
   * caller.  The returned IOBuf may actually have slightly more capacity than
   * requested.
   *
   * The data pointer will initially point to the start of the newly allocated
   * buffer, and will have a data length of 0.
   *
   * Throws std::bad_alloc on error.
   */
  static std::unique_ptr<IOBuf> create(std::size_t capacity);
  IOBuf(CreateOp, std::size_t capacity);

  /**
   * Create a new IOBuf, using a single memory allocation to allocate space
   * for both the IOBuf object and the data storage space.
   *
   * This saves one memory allocation.  However, it can be wasteful if you
   * later need to grow the buffer using reserve().  If the buffer needs to be
   * reallocated, the space originally allocated will not be freed() until the
   * IOBuf object itself is also freed.  (It can also be slightly wasteful in
   * some cases where you clone this IOBuf and then free the original IOBuf.)
   */
  static std::unique_ptr<IOBuf> createCombined(std::size_t capacity);

  /**
   * Create a new IOBuf, using separate memory allocations for the IOBuf object
   * for the IOBuf and the data storage space.
   *
   * This requires two memory allocations, but saves space in the long run
   * if you know that you will need to reallocate the data buffer later.
   */
  static std::unique_ptr<IOBuf> createSeparate(std::size_t capacity);

  /**
   * Allocate a new IOBuf chain with the requested total capacity, allocating
   * no more than maxBufCapacity to each buffer.
   */
  static std::unique_ptr<IOBuf> createChain(
      size_t totalCapacity,
      std::size_t maxBufCapacity);

  /**
   * Create a new IOBuf pointing to an existing data buffer.
   *
   * The new IOBuffer will assume ownership of the buffer, and free it by
   * calling the specified FreeFunction when the last IOBuf pointing to this
   * buffer is destroyed.  The function will be called with a pointer to the
   * buffer as the first argument, and the supplied userData value as the
   * second argument.  The free function must never throw exceptions.
   *
   * If no FreeFunction is specified, the buffer will be freed using free()
   * which will result in undefined behavior if the memory was allocated
   * using 'new'.
   *
   * The IOBuf data pointer will initially point to the start of the buffer,
   *
   * In the first version of this function, the length of data is unspecified
   * and is initialized to the capacity of the buffer
   *
   * In the second version, the user specifies the valid length of data
   * in the buffer
   *
   * On error, std::bad_alloc will be thrown.  If freeOnError is true (the
   * default) the buffer will be freed before throwing the error.
   */
  static std::unique_ptr<IOBuf> takeOwnership(
      void* buf,
      std::size_t capacity,
      FreeFunction freeFn = nullptr,
      void* userData = nullptr,
      bool freeOnError = true) {
    return takeOwnership(
        buf, capacity, capacity, freeFn, userData, freeOnError);
  }
  IOBuf(
      TakeOwnershipOp op,
      void* buf,
      std::size_t capacity,
      FreeFunction freeFn = nullptr,
      void* userData = nullptr,
      bool freeOnError = true)
      : IOBuf(op, buf, capacity, capacity, freeFn, userData, freeOnError) {}

  static std::unique_ptr<IOBuf> takeOwnership(
      void* buf,
      std::size_t capacity,
      std::size_t length,
      FreeFunction freeFn = nullptr,
      void* userData = nullptr,
      bool freeOnError = true);
  IOBuf(
      TakeOwnershipOp,
      void* buf,
      std::size_t capacity,
      std::size_t length,
      FreeFunction freeFn = nullptr,
      void* userData = nullptr,
      bool freeOnError = true);

  /**
   * Create a new IOBuf pointing to an existing data buffer made up of
   * count objects of a given standard-layout type.
   *
   * This is dangerous -- it is essentially equivalent to doing
   * reinterpret_cast<unsigned char*> on your data -- but it's often useful
   * for serialization / deserialization.
   *
   * The new IOBuffer will assume ownership of the buffer, and free it
   * appropriately (by calling the UniquePtr's custom deleter, or by calling
   * delete or delete[] appropriately if there is no custom deleter)
   * when the buffer is destroyed.  The custom deleter, if any, must never
   * throw exceptions.
   *
   * The IOBuf data pointer will initially point to the start of the buffer,
   * and the length will be the full capacity of the buffer (count *
   * sizeof(T)).
   *
   * On error, std::bad_alloc will be thrown, and the buffer will be freed
   * before throwing the error.
   */
  template <class UniquePtr>
  static typename std::enable_if<
      detail::IsUniquePtrToSL<UniquePtr>::value,
      std::unique_ptr<IOBuf>>::type
  takeOwnership(UniquePtr&& buf, size_t count = 1);

  /**
   * Create a new IOBuf object that points to an existing user-owned buffer.
   *
   * This should only be used when the caller knows the lifetime of the IOBuf
   * object ahead of time and can ensure that all IOBuf objects that will point
   * to this buffer will be destroyed before the buffer itself is destroyed.
   *
   * This buffer will not be freed automatically when the last IOBuf
   * referencing it is destroyed.  It is the caller's responsibility to free
   * the buffer after the last IOBuf has been destroyed.
   *
   * The IOBuf data pointer will initially point to the start of the buffer,
   * and the length will be the full capacity of the buffer.
   *
   * An IOBuf created using wrapBuffer() will always be reported as shared.
   * unshare() may be used to create a writable copy of the buffer.
   *
   * On error, std::bad_alloc will be thrown.
   */
  static std::unique_ptr<IOBuf> wrapBuffer(
      const void* buf,
      std::size_t capacity);
  static std::unique_ptr<IOBuf> wrapBuffer(ByteRange br) {
    return wrapBuffer(br.data(), br.size());
  }

  /**
   * Similar to wrapBuffer(), but returns IOBuf by value rather than
   * heap-allocating it.
   */
  static IOBuf wrapBufferAsValue(
      const void* buf,
      std::size_t capacity) noexcept;
  static IOBuf wrapBufferAsValue(ByteRange br) noexcept {
    return wrapBufferAsValue(br.data(), br.size());
  }

  IOBuf(WrapBufferOp op, const void* buf, std::size_t capacity) noexcept;
  IOBuf(WrapBufferOp op, ByteRange br) noexcept;

  /**
   * Convenience function to create a new IOBuf object that copies data from a
   * user-supplied buffer, optionally allocating a given amount of
   * headroom and tailroom.
   */
  static std::unique_ptr<IOBuf> copyBuffer(
      const void* buf,
      std::size_t size,
      std::size_t headroom = 0,
      std::size_t minTailroom = 0);
  static std::unique_ptr<IOBuf> copyBuffer(
      ByteRange br,
      std::size_t headroom = 0,
      std::size_t minTailroom = 0) {
    return copyBuffer(br.data(), br.size(), headroom, minTailroom);
  }
  IOBuf(
      CopyBufferOp op,
      const void* buf,
      std::size_t size,
      std::size_t headroom = 0,
      std::size_t minTailroom = 0);
  IOBuf(
      CopyBufferOp op,
      ByteRange br,
      std::size_t headroom = 0,
      std::size_t minTailroom = 0);

  /**
   * Convenience function to create a new IOBuf object that copies data from a
   * user-supplied string, optionally allocating a given amount of
   * headroom and tailroom.
   *
   * Beware when attempting to invoke this function with a constant string
   * literal and a headroom argument: you will likely end up invoking the
   * version of copyBuffer() above.  IOBuf::copyBuffer("hello", 3) will treat
   * the first argument as a const void*, and will invoke the version of
   * copyBuffer() above, with the size argument of 3.
   */
  static std::unique_ptr<IOBuf> copyBuffer(
      const std::string& buf,
      std::size_t headroom = 0,
      std::size_t minTailroom = 0);
  IOBuf(
      CopyBufferOp op,
      const std::string& buf,
      std::size_t headroom = 0,
      std::size_t minTailroom = 0)
      : IOBuf(op, buf.data(), buf.size(), headroom, minTailroom) {}

  /**
   * A version of copyBuffer() that returns a null pointer if the input string
   * is empty.
   */
  static std::unique_ptr<IOBuf> maybeCopyBuffer(
      const std::string& buf,
      std::size_t headroom = 0,
      std::size_t minTailroom = 0);

  /**
   * Convenience function to free a chain of IOBufs held by a unique_ptr.
   */
  static void destroy(std::unique_ptr<IOBuf>&& data) {
    auto destroyer = std::move(data);
  }

  /**
   * Destroy this IOBuf.
   *
   * Deleting an IOBuf will automatically destroy all IOBufs in the chain.
   * (See the comments above regarding the ownership model of IOBuf chains.
   * All subsequent IOBufs in the chain are considered to be owned by the head
   * of the chain.  Users should only explicitly delete the head of a chain.)
   *
   * When each individual IOBuf is destroyed, it will release its reference
   * count on the underlying buffer.  If it was the last user of the buffer,
   * the buffer will be freed.
   */
  ~IOBuf();

  /**
   * Check whether the chain is empty (i.e., whether the IOBufs in the
   * chain have a total data length of zero).
   *
   * This method is semantically equivalent to
   *   i->computeChainDataLength()==0
   * but may run faster because it can short-circuit as soon as it
   * encounters a buffer with length()!=0
   */
  bool empty() const;

  /**
   * Get the pointer to the start of the data.
   */
  const uint8_t* data() const {
    return data_;
  }

  /**
   * Get a writable pointer to the start of the data.
   *
   * The caller is responsible for calling unshare() first to ensure that it is
   * actually safe to write to the buffer.
   */
  uint8_t* writableData() {
    return data_;
  }

  /**
   * Get the pointer to the end of the data.
   */
  const uint8_t* tail() const {
    return data_ + length_;
  }

  /**
   * Get a writable pointer to the end of the data.
   *
   * The caller is responsible for calling unshare() first to ensure that it is
   * actually safe to write to the buffer.
   */
  uint8_t* writableTail() {
    return data_ + length_;
  }

  /**
   * Get the data length.
   */
  std::size_t length() const {
    return length_;
  }

  /**
   * Get the amount of head room.
   *
   * Returns the number of bytes in the buffer before the start of the data.
   */
  std::size_t headroom() const {
    return std::size_t(data_ - buffer());
  }

  /**
   * Get the amount of tail room.
   *
   * Returns the number of bytes in the buffer after the end of the data.
   */
  std::size_t tailroom() const {
    return std::size_t(bufferEnd() - tail());
  }

  /**
   * Get the pointer to the start of the buffer.
   *
   * Note that this is the pointer to the very beginning of the usable buffer,
   * not the start of valid data within the buffer.  Use the data() method to
   * get a pointer to the start of the data within the buffer.
   */
  const uint8_t* buffer() const {
    return buf_;
  }

  /**
   * Get a writable pointer to the start of the buffer.
   *
   * The caller is responsible for calling unshare() first to ensure that it is
   * actually safe to write to the buffer.
   */
  uint8_t* writableBuffer() {
    return buf_;
  }

  /**
   * Get the pointer to the end of the buffer.
   *
   * Note that this is the pointer to the very end of the usable buffer,
   * not the end of valid data within the buffer.  Use the tail() method to
   * get a pointer to the end of the data within the buffer.
   */
  const uint8_t* bufferEnd() const {
    return buf_ + capacity_;
  }

  /**
   * Get the total size of the buffer.
   *
   * This returns the total usable length of the buffer.  Use the length()
   * method to get the length of the actual valid data in this IOBuf.
   */
  std::size_t capacity() const {
    return capacity_;
  }

  /**
   * Get a pointer to the next IOBuf in this chain.
   */
  IOBuf* next() {
    return next_;
  }
  const IOBuf* next() const {
    return next_;
  }

  /**
   * Get a pointer to the previous IOBuf in this chain.
   */
  IOBuf* prev() {
    return prev_;
  }
  const IOBuf* prev() const {
    return prev_;
  }

  /**
   * Shift the data forwards in the buffer.
   *
   * This shifts the data pointer forwards in the buffer to increase the
   * headroom.  This is commonly used to increase the headroom in a newly
   * allocated buffer.
   *
   * The caller is responsible for ensuring that there is sufficient
   * tailroom in the buffer before calling advance().
   *
   * If there is a non-zero data length, advance() will use memmove() to shift
   * the data forwards in the buffer.  In this case, the caller is responsible
   * for making sure the buffer is unshared, so it will not affect other IOBufs
   * that may be sharing the same underlying buffer.
   */
  void advance(std::size_t amount) {
    // In debug builds, assert if there is a problem.
    assert(amount <= tailroom());

    if (length_ > 0) {
      memmove(data_ + amount, data_, length_);
    }
    data_ += amount;
  }

  /**
   * Shift the data backwards in the buffer.
   *
   * The caller is responsible for ensuring that there is sufficient headroom
   * in the buffer before calling retreat().
   *
   * If there is a non-zero data length, retreat() will use memmove() to shift
   * the data backwards in the buffer.  In this case, the caller is responsible
   * for making sure the buffer is unshared, so it will not affect other IOBufs
   * that may be sharing the same underlying buffer.
   */
  void retreat(std::size_t amount) {
    // In debug builds, assert if there is a problem.
    assert(amount <= headroom());

    if (length_ > 0) {
      memmove(data_ - amount, data_, length_);
    }
    data_ -= amount;
  }

  /**
   * Adjust the data pointer to include more valid data at the beginning.
   *
   * This moves the data pointer backwards to include more of the available
   * buffer.  The caller is responsible for ensuring that there is sufficient
   * headroom for the new data.  The caller is also responsible for populating
   * this section with valid data.
   *
   * This does not modify any actual data in the buffer.
   */
  void prepend(std::size_t amount) {
    DCHECK_LE(amount, headroom());
    data_ -= amount;
    length_ += amount;
  }

  /**
   * Adjust the tail pointer to include more valid data at the end.
   *
   * This moves the tail pointer forwards to include more of the available
   * buffer.  The caller is responsible for ensuring that there is sufficient
   * tailroom for the new data.  The caller is also responsible for populating
   * this section with valid data.
   *
   * This does not modify any actual data in the buffer.
   */
  void append(std::size_t amount) {
    DCHECK_LE(amount, tailroom());
    length_ += amount;
  }

  /**
   * Adjust the data pointer forwards to include less valid data.
   *
   * This moves the data pointer forwards so that the first amount bytes are no
   * longer considered valid data.  The caller is responsible for ensuring that
   * amount is less than or equal to the actual data length.
   *
   * This does not modify any actual data in the buffer.
   */
  void trimStart(std::size_t amount) {
    DCHECK_LE(amount, length_);
    data_ += amount;
    length_ -= amount;
  }

  /**
   * Adjust the tail pointer backwards to include less valid data.
   *
   * This moves the tail pointer backwards so that the last amount bytes are no
   * longer considered valid data.  The caller is responsible for ensuring that
   * amount is less than or equal to the actual data length.
   *
   * This does not modify any actual data in the buffer.
   */
  void trimEnd(std::size_t amount) {
    DCHECK_LE(amount, length_);
    length_ -= amount;
  }

  /**
   * Clear the buffer.
   *
   * Postcondition: headroom() == 0, length() == 0, tailroom() == capacity()
   */
  void clear() {
    data_ = writableBuffer();
    length_ = 0;
  }

  /**
   * Ensure that this buffer has at least minHeadroom headroom bytes and at
   * least minTailroom tailroom bytes.  The buffer must be writable
   * (you must call unshare() before this, if necessary).
   *
   * Postcondition: headroom() >= minHeadroom, tailroom() >= minTailroom,
   * the data (between data() and data() + length()) is preserved.
   */
  void reserve(std::size_t minHeadroom, std::size_t minTailroom) {
    // Maybe we don't need to do anything.
    if (headroom() >= minHeadroom && tailroom() >= minTailroom) {
      return;
    }
    // If the buffer is empty but we have enough total room (head + tail),
    // move the data_ pointer around.
    if (length() == 0 && headroom() + tailroom() >= minHeadroom + minTailroom) {
      data_ = writableBuffer() + minHeadroom;
      return;
    }
    // Bah, we have to do actual work.
    reserveSlow(minHeadroom, minTailroom);
  }

  /**
   * Return true if this IOBuf is part of a chain of multiple IOBufs, or false
   * if this is the only IOBuf in its chain.
   */
  bool isChained() const {
    assert((next_ == this) == (prev_ == this));
    return next_ != this;
  }

  /**
   * Get the number of IOBufs in this chain.
   *
   * Beware that this method has to walk the entire chain.
   * Use isChained() if you just want to check if this IOBuf is part of a chain
   * or not.
   */
  size_t countChainElements() const;

  /**
   * Get the length of all the data in this IOBuf chain.
   *
   * Beware that this method has to walk the entire chain.
   */
  std::size_t computeChainDataLength() const;

  /**
   * Insert another IOBuf chain immediately before this IOBuf.
   *
   * For example, if there are two IOBuf chains (A, B, C) and (D, E, F),
   * and B->prependChain(D) is called, the (D, E, F) chain will be subsumed
   * and become part of the chain starting at A, which will now look like
   * (A, D, E, F, B, C)
   *
   * Note that since IOBuf chains are circular, head->prependChain(other) can
   * be used to append the other chain at the very end of the chain pointed to
   * by head.  For example, if there are two IOBuf chains (A, B, C) and
   * (D, E, F), and A->prependChain(D) is called, the chain starting at A will
   * now consist of (A, B, C, D, E, F)
   *
   * The elements in the specified IOBuf chain will become part of this chain,
   * and will be owned by the head of this chain.  When this chain is
   * destroyed, all elements in the supplied chain will also be destroyed.
   *
   * For this reason, appendChain() only accepts an rvalue-reference to a
   * unique_ptr(), to make it clear that it is taking ownership of the supplied
   * chain.  If you have a raw pointer, you can pass in a new temporary
   * unique_ptr around the raw pointer.  If you have an existing,
   * non-temporary unique_ptr, you must call std::move(ptr) to make it clear
   * that you are destroying the original pointer.
   */
  void prependChain(std::unique_ptr<IOBuf>&& iobuf);

  /**
   * Append another IOBuf chain immediately after this IOBuf.
   *
   * For example, if there are two IOBuf chains (A, B, C) and (D, E, F),
   * and B->appendChain(D) is called, the (D, E, F) chain will be subsumed
   * and become part of the chain starting at A, which will now look like
   * (A, B, D, E, F, C)
   *
   * The elements in the specified IOBuf chain will become part of this chain,
   * and will be owned by the head of this chain.  When this chain is
   * destroyed, all elements in the supplied chain will also be destroyed.
   *
   * For this reason, appendChain() only accepts an rvalue-reference to a
   * unique_ptr(), to make it clear that it is taking ownership of the supplied
   * chain.  If you have a raw pointer, you can pass in a new temporary
   * unique_ptr around the raw pointer.  If you have an existing,
   * non-temporary unique_ptr, you must call std::move(ptr) to make it clear
   * that you are destroying the original pointer.
   */
  void appendChain(std::unique_ptr<IOBuf>&& iobuf) {
    // Just use prependChain() on the next element in our chain
    next_->prependChain(std::move(iobuf));
  }

  /**
   * Remove this IOBuf from its current chain.
   *
   * Since ownership of all elements an IOBuf chain is normally maintained by
   * the head of the chain, unlink() transfers ownership of this IOBuf from the
   * chain and gives it to the caller.  A new unique_ptr to the IOBuf is
   * returned to the caller.  The caller must store the returned unique_ptr (or
   * call release() on it) to take ownership, otherwise the IOBuf will be
   * immediately destroyed.
   *
   * Since unlink transfers ownership of the IOBuf to the caller, be careful
   * not to call unlink() on the head of a chain if you already maintain
   * ownership on the head of the chain via other means.  The pop() method
   * is a better choice for that situation.
   */
  std::unique_ptr<IOBuf> unlink() {
    next_->prev_ = prev_;
    prev_->next_ = next_;
    prev_ = this;
    next_ = this;
    return std::unique_ptr<IOBuf>(this);
  }

  /**
   * Remove this IOBuf from its current chain and return a unique_ptr to
   * the IOBuf that formerly followed it in the chain.
   */
  std::unique_ptr<IOBuf> pop() {
    IOBuf* next = next_;
    next_->prev_ = prev_;
    prev_->next_ = next_;
    prev_ = this;
    next_ = this;
    return std::unique_ptr<IOBuf>((next == this) ? nullptr : next);
  }

  /**
   * Remove a subchain from this chain.
   *
   * Remove the subchain starting at head and ending at tail from this chain.
   *
   * Returns a unique_ptr pointing to head.  (In other words, ownership of the
   * head of the subchain is transferred to the caller.)  If the caller ignores
   * the return value and lets the unique_ptr be destroyed, the subchain will
   * be immediately destroyed.
   *
   * The subchain referenced by the specified head and tail must be part of the
   * same chain as the current IOBuf, but must not contain the current IOBuf.
   * However, the specified head and tail may be equal to each other (i.e.,
   * they may be a subchain of length 1).
   */
  std::unique_ptr<IOBuf> separateChain(IOBuf* head, IOBuf* tail) {
    assert(head != this);
    assert(tail != this);

    head->prev_->next_ = tail->next_;
    tail->next_->prev_ = head->prev_;

    head->prev_ = tail;
    tail->next_ = head;

    return std::unique_ptr<IOBuf>(head);
  }

  /**
   * Return true if at least one of the IOBufs in this chain are shared,
   * or false if all of the IOBufs point to unique buffers.
   *
   * Use isSharedOne() to only check this IOBuf rather than the entire chain.
   */
  bool isShared() const {
    const IOBuf* current = this;
    while (true) {
      if (current->isSharedOne()) {
        return true;
      }
      current = current->next_;
      if (current == this) {
        return false;
      }
    }
  }

  /**
   * Return true if all IOBufs in this chain are managed by the usual
   * refcounting mechanism (and so the lifetime of the underlying memory
   * can be extended by clone()).
   */
  bool isManaged() const {
    const IOBuf* current = this;
    while (true) {
      if (!current->isManagedOne()) {
        return false;
      }
      current = current->next_;
      if (current == this) {
        return true;
      }
    }
  }

  /**
   * Return true if this IOBuf is managed by the usual refcounting mechanism
   * (and so the lifetime of the underlying memory can be extended by
   * cloneOne()).
   */
  bool isManagedOne() const {
    return sharedInfo();
  }

  /**
   * Return true if other IOBufs are also pointing to the buffer used by this
   * IOBuf, and false otherwise.
   *
   * If this IOBuf points at a buffer owned by another (non-IOBuf) part of the
   * code (i.e., if the IOBuf was created using wrapBuffer(), or was cloned
   * from such an IOBuf), it is always considered shared.
   *
   * This only checks the current IOBuf, and not other IOBufs in the chain.
   */
  bool isSharedOne() const {
    // If this is a user-owned buffer, it is always considered shared
    if (UNLIKELY(!sharedInfo())) {
      return true;
    }

    if (UNLIKELY(sharedInfo()->externallyShared)) {
      return true;
    }

    if (LIKELY(!(flags() & kFlagMaybeShared))) {
      return false;
    }

    // kFlagMaybeShared is set, so we need to check the reference count.
    // (Checking the reference count requires an atomic operation, which is why
    // we prefer to only check kFlagMaybeShared if possible.)
    bool shared = sharedInfo()->refcount.load(std::memory_order_acquire) > 1;
    if (!shared) {
      // we're the last one left
      clearFlags(kFlagMaybeShared);
    }
    return shared;
  }

  /**
   * Ensure that this IOBuf has a unique buffer that is not shared by other
   * IOBufs.
   *
   * unshare() operates on an entire chain of IOBuf objects.  If the chain is
   * shared, it may also coalesce the chain when making it unique.  If the
   * chain is coalesced, subsequent IOBuf objects in the current chain will be
   * automatically deleted.
   *
   * Note that buffers owned by other (non-IOBuf) users are automatically
   * considered shared.
   *
   * Throws std::bad_alloc on error.  On error the IOBuf chain will be
   * unmodified.
   *
   * Currently unshare may also throw std::overflow_error if it tries to
   * coalesce.  (TODO: In the future it would be nice if unshare() were smart
   * enough not to coalesce the entire buffer if the data is too large.
   * However, in practice this seems unlikely to become an issue.)
   */
  void unshare() {
    if (isChained()) {
      unshareChained();
    } else {
      unshareOne();
    }
  }

  /**
   * Ensure that this IOBuf has a unique buffer that is not shared by other
   * IOBufs.
   *
   * unshareOne() operates on a single IOBuf object.  This IOBuf will have a
   * unique buffer after unshareOne() returns, but other IOBufs in the chain
   * may still be shared after unshareOne() returns.
   *
   * Throws std::bad_alloc on error.  On error the IOBuf will be unmodified.
   */
  void unshareOne() {
    if (isSharedOne()) {
      unshareOneSlow();
    }
  }

  /**
   * Mark the underlying buffers in this chain as shared with external memory
   * management mechanism. This will make isShared() always returns true.
   *
   * This function is not thread-safe, and only safe to call immediately after
   * creating an IOBuf, before it has been shared with other threads.
   */
  void markExternallyShared();

  /**
   * Mark the underlying buffer that this IOBuf refers to as shared with
   * external memory management mechanism. This will make isSharedOne() always
   * returns true.
   *
   * This function is not thread-safe, and only safe to call immediately after
   * creating an IOBuf, before it has been shared with other threads.
   */
  void markExternallySharedOne() {
    SharedInfo* info = sharedInfo();
    if (info) {
      info->externallyShared = true;
    }
  }

  /**
   * Ensure that the memory that IOBufs in this chain refer to will continue to
   * be allocated for as long as the IOBufs of the chain (or any clone()s
   * created from this point onwards) is alive.
   *
   * This only has an effect for user-owned buffers (created with the
   * WRAP_BUFFER constructor or wrapBuffer factory function), in which case
   * those buffers are unshared.
   */
  void makeManaged() {
    if (isChained()) {
      makeManagedChained();
    } else {
      makeManagedOne();
    }
  }

  /**
   * Ensure that the memory that this IOBuf refers to will continue to be
   * allocated for as long as this IOBuf (or any clone()s created from this
   * point onwards) is alive.
   *
   * This only has an effect for user-owned buffers (created with the
   * WRAP_BUFFER constructor or wrapBuffer factory function), in which case
   * those buffers are unshared.
   */
  void makeManagedOne() {
    if (!isManagedOne()) {
      // We can call the internal function directly; unmanaged implies shared.
      unshareOneSlow();
    }
  }

  /**
   * Coalesce this IOBuf chain into a single buffer.
   *
   * This method moves all of the data in this IOBuf chain into a single
   * contiguous buffer, if it is not already in one buffer.  After coalesce()
   * returns, this IOBuf will be a chain of length one.  Other IOBufs in the
   * chain will be automatically deleted.
   *
   * After coalescing, the IOBuf will have at least as much headroom as the
   * first IOBuf in the chain, and at least as much tailroom as the last IOBuf
   * in the chain.
   *
   * Throws std::bad_alloc on error.  On error the IOBuf chain will be
   * unmodified.
   *
   * Returns ByteRange that points to the data IOBuf stores.
   */
  ByteRange coalesce() {
    const std::size_t newHeadroom = headroom();
    const std::size_t newTailroom = prev()->tailroom();
    return coalesceWithHeadroomTailroom(newHeadroom, newTailroom);
  }

  /**
   * This is similar to the coalesce() method, except this allows to set a
   * headroom and tailroom after coalescing.
   *
   * Returns ByteRange that points to the data IOBuf stores.
   */
  ByteRange coalesceWithHeadroomTailroom(
      std::size_t newHeadroom,
      std::size_t newTailroom) {
    if (isChained()) {
      coalesceAndReallocate(
          newHeadroom, computeChainDataLength(), this, newTailroom);
    }
    return ByteRange(data_, length_);
  }

  /**
   * Ensure that this chain has at least maxLength bytes available as a
   * contiguous memory range.
   *
   * This method coalesces whole buffers in the chain into this buffer as
   * necessary until this buffer's length() is at least maxLength.
   *
   * After coalescing, the IOBuf will have at least as much headroom as the
   * first IOBuf in the chain, and at least as much tailroom as the last IOBuf
   * that was coalesced.
   *
   * Throws std::bad_alloc or std::overflow_error on error.  On error the IOBuf
   * chain will be unmodified.  Throws std::overflow_error if maxLength is
   * longer than the total chain length.
   *
   * Upon return, either enough of the chain was coalesced into a contiguous
   * region, or the entire chain was coalesced.  That is,
   * length() >= maxLength || !isChained() is true.
   */
  void gather(std::size_t maxLength) {
    if (!isChained() || length_ >= maxLength) {
      return;
    }
    coalesceSlow(maxLength);
  }

  /**
   * Return a new IOBuf chain sharing the same data as this chain.
   *
   * The new IOBuf chain will normally point to the same underlying data
   * buffers as the original chain.  (The one exception to this is if some of
   * the IOBufs in this chain contain small internal data buffers which cannot
   * be shared.)
   */
  std::unique_ptr<IOBuf> clone() const;

  /**
   * Similar to clone(). But returns IOBuf by value rather than heap-allocating
   * it.
   */
  IOBuf cloneAsValue() const;

  /**
   * Return a new IOBuf with the same data as this IOBuf.
   *
   * The new IOBuf returned will not be part of a chain (even if this IOBuf is
   * part of a larger chain).
   */
  std::unique_ptr<IOBuf> cloneOne() const;

  /**
   * Similar to cloneOne(). But returns IOBuf by value rather than
   * heap-allocating it.
   */
  IOBuf cloneOneAsValue() const;

  /**
   * Return a new unchained IOBuf that may share the same data as this chain.
   *
   * If the IOBuf chain is not chained then the new IOBuf will point to the same
   * underlying data buffer as the original chain. Otherwise, it will clone and
   * coalesce the IOBuf chain.
   *
   * The new IOBuf will have at least as much headroom as the first IOBuf in the
   * chain, and at least as much tailroom as the last IOBuf in the chain.
   *
   * Throws std::bad_alloc on error.
   */
  std::unique_ptr<IOBuf> cloneCoalesced() const;

  /**
   * This is similar to the cloneCoalesced() method, except this allows to set a
   * headroom and tailroom for the new IOBuf.
   */
  std::unique_ptr<IOBuf> cloneCoalescedWithHeadroomTailroom(
      std::size_t newHeadroom,
      std::size_t newTailroom) const;

  /**
   * Similar to cloneCoalesced(). But returns IOBuf by value rather than
   * heap-allocating it.
   */
  IOBuf cloneCoalescedAsValue() const;

  /**
   * This is similar to the cloneCoalescedAsValue() method, except this allows
   * to set a headroom and tailroom for the new IOBuf.
   */
  IOBuf cloneCoalescedAsValueWithHeadroomTailroom(
      std::size_t newHeadroom,
      std::size_t newTailroom) const;

  /**
   * Similar to Clone(). But use other as the head node. Other nodes in the
   * chain (if any) will be allocted on heap.
   */
  void cloneInto(IOBuf& other) const {
    other = cloneAsValue();
  }

  /**
   * Similar to CloneOne(). But to fill an existing IOBuf instead of a new
   * IOBuf.
   */
  void cloneOneInto(IOBuf& other) const {
    other = cloneOneAsValue();
  }

  /**
   * Return an iovector suitable for e.g. writev()
   *
   *   auto iov = buf->getIov();
   *   auto xfer = writev(fd, iov.data(), iov.size());
   *
   * Naturally, the returned iovector is invalid if you modify the buffer
   * chain.
   */
  folly::fbvector<struct iovec> getIov() const;

  /**
   * Update an existing iovec array with the IOBuf data.
   *
   * New iovecs will be appended to the existing vector; anything already
   * present in the vector will be left unchanged.
   *
   * Naturally, the returned iovec data will be invalid if you modify the
   * buffer chain.
   */
  void appendToIov(folly::fbvector<struct iovec>* iov) const;

  /**
   * Fill an iovec array with the IOBuf data.
   *
   * Returns the number of iovec filled. If there are more buffer than
   * iovec, returns 0. This version is suitable to use with stack iovec
   * arrays.
   *
   * Naturally, the filled iovec data will be invalid if you modify the
   * buffer chain.
   */
  size_t fillIov(struct iovec* iov, size_t len) const;

  /**
   * A helper that wraps a number of iovecs into an IOBuf chain.  If count == 0,
   * then a zero length buf is returned.  This function never returns nullptr.
   */
  static std::unique_ptr<IOBuf> wrapIov(const iovec* vec, size_t count);

  /**
   * A helper that takes ownerships a number of iovecs into an IOBuf chain.  If
   * count == 0, then a zero length buf is returned.  This function never
   * returns nullptr.
   */
  static std::unique_ptr<IOBuf> takeOwnershipIov(
      const iovec* vec,
      size_t count,
      FreeFunction freeFn = nullptr,
      void* userData = nullptr,
      bool freeOnError = true);

  /*
   * Overridden operator new and delete.
   * These perform specialized memory management to help support
   * createCombined(), which allocates IOBuf objects together with the buffer
   * data.
   */
  void* operator new(size_t size);
  void* operator new(size_t size, void* ptr);
  void operator delete(void* ptr);
  void operator delete(void* ptr, void* placement);

  /**
   * Destructively convert this IOBuf to a fbstring efficiently.
   * We rely on fbstring's AcquireMallocatedString constructor to
   * transfer memory.
   */
  fbstring moveToFbString();

  /**
   * Iteration support: a chain of IOBufs may be iterated through using
   * STL-style iterators over const ByteRanges.  Iterators are only invalidated
   * if the IOBuf that they currently point to is removed.
   */
  Iterator cbegin() const;
  Iterator cend() const;
  Iterator begin() const;
  Iterator end() const;

  /**
   * Allocate a new null buffer.
   *
   * This can be used to allocate an empty IOBuf on the stack.  It will have no
   * space allocated for it.  This is generally useful only to later use move
   * assignment to fill out the IOBuf.
   */
  IOBuf() noexcept;

  /**
   * Move constructor and assignment operator.
   *
   * In general, you should only ever move the head of an IOBuf chain.
   * Internal nodes in an IOBuf chain are owned by the head of the chain, and
   * should not be moved from.  (Technically, nothing prevents you from moving
   * a non-head node, but the moved-to node will replace the moved-from node in
   * the chain.  This has implications for ownership, since non-head nodes are
   * owned by the chain head.  You are then responsible for relinquishing
   * ownership of the moved-to node, and manually deleting the moved-from
   * node.)
   *
   * With the move assignment operator, the destination of the move should be
   * the head of an IOBuf chain or a solitary IOBuf not part of a chain.  If
   * the move destination is part of a chain, all other IOBufs in the chain
   * will be deleted.
   */
  IOBuf(IOBuf&& other) noexcept;
  IOBuf& operator=(IOBuf&& other) noexcept;

  IOBuf(const IOBuf& other);
  IOBuf& operator=(const IOBuf& other);

 private:
  enum FlagsEnum : uintptr_t {
    // Adding any more flags would not work on 32-bit architectures,
    // as these flags are stashed in the least significant 2 bits of a
    // max-align-aligned pointer.
    kFlagFreeSharedInfo = 0x1,
    kFlagMaybeShared = 0x2,
    kFlagMask = kFlagFreeSharedInfo | kFlagMaybeShared
  };

  struct SharedInfo {
    SharedInfo();
    SharedInfo(FreeFunction fn, void* arg);

    // A pointer to a function to call to free the buffer when the refcount
    // hits 0.  If this is null, free() will be used instead.
    FreeFunction freeFn;
    void* userData;
    std::atomic<uint32_t> refcount;
    bool externallyShared{false};
  };
  // Helper structs for use by operator new and delete
  struct HeapPrefix;
  struct HeapStorage;
  struct HeapFullStorage;

  /**
   * Create a new IOBuf pointing to an external buffer.
   *
   * The caller is responsible for holding a reference count for this new
   * IOBuf.  The IOBuf constructor does not automatically increment the
   * reference count.
   */
  struct InternalConstructor {}; // avoid conflicts
  IOBuf(
      InternalConstructor,
      uintptr_t flagsAndSharedInfo,
      uint8_t* buf,
      std::size_t capacity,
      uint8_t* data,
      std::size_t length) noexcept;

  void unshareOneSlow();
  void unshareChained();
  void makeManagedChained();
  void coalesceSlow();
  void coalesceSlow(size_t maxLength);
  // newLength must be the entire length of the buffers between this and
  // end (no truncation)
  void coalesceAndReallocate(
      size_t newHeadroom,
      size_t newLength,
      IOBuf* end,
      size_t newTailroom);
  void coalesceAndReallocate(size_t newLength, IOBuf* end) {
    coalesceAndReallocate(headroom(), newLength, end, end->prev_->tailroom());
  }
  void decrementRefcount();
  void reserveSlow(std::size_t minHeadroom, std::size_t minTailroom);
  void freeExtBuffer();

  static size_t goodExtBufferSize(std::size_t minCapacity);
  static void initExtBuffer(
      uint8_t* buf,
      size_t mallocSize,
      SharedInfo** infoReturn,
      std::size_t* capacityReturn);
  static void allocExtBuffer(
      std::size_t minCapacity,
      uint8_t** bufReturn,
      SharedInfo** infoReturn,
      std::size_t* capacityReturn);
  static void releaseStorage(HeapStorage* storage, uint16_t freeFlags);
  static void freeInternalBuf(void* buf, void* userData);

  /*
   * Member variables
   */

  /*
   * Links to the next and the previous IOBuf in this chain.
   *
   * The chain is circularly linked (the last element in the chain points back
   * at the head), and next_ and prev_ can never be null.  If this IOBuf is the
   * only element in the chain, next_ and prev_ will both point to this.
   */
  IOBuf* next_{this};
  IOBuf* prev_{this};

  /*
   * A pointer to the start of the data referenced by this IOBuf, and the
   * length of the data.
   *
   * This may refer to any subsection of the actual buffer capacity.
   */
  uint8_t* data_{nullptr};
  uint8_t* buf_{nullptr};
  std::size_t length_{0};
  std::size_t capacity_{0};

  // Pack flags in least significant 2 bits, sharedInfo in the rest
  mutable uintptr_t flagsAndSharedInfo_{0};

  static inline uintptr_t packFlagsAndSharedInfo(
      uintptr_t flags,
      SharedInfo* info) {
    uintptr_t uinfo = reinterpret_cast<uintptr_t>(info);
    DCHECK_EQ(flags & ~kFlagMask, 0u);
    DCHECK_EQ(uinfo & kFlagMask, 0u);
    return flags | uinfo;
  }

  inline SharedInfo* sharedInfo() const {
    return reinterpret_cast<SharedInfo*>(flagsAndSharedInfo_ & ~kFlagMask);
  }

  inline void setSharedInfo(SharedInfo* info) {
    uintptr_t uinfo = reinterpret_cast<uintptr_t>(info);
    DCHECK_EQ(uinfo & kFlagMask, 0u);
    flagsAndSharedInfo_ = (flagsAndSharedInfo_ & kFlagMask) | uinfo;
  }

  inline uintptr_t flags() const {
    return flagsAndSharedInfo_ & kFlagMask;
  }

  // flags_ are changed from const methods
  inline void setFlags(uintptr_t flags) const {
    DCHECK_EQ(flags & ~kFlagMask, 0u);
    flagsAndSharedInfo_ |= flags;
  }

  inline void clearFlags(uintptr_t flags) const {
    DCHECK_EQ(flags & ~kFlagMask, 0u);
    flagsAndSharedInfo_ &= ~flags;
  }

  inline void setFlagsAndSharedInfo(uintptr_t flags, SharedInfo* info) {
    flagsAndSharedInfo_ = packFlagsAndSharedInfo(flags, info);
  }

  struct DeleterBase {
    virtual ~DeleterBase() {}
    virtual void dispose(void* p) = 0;
  };

  template <class UniquePtr>
  struct UniquePtrDeleter : public DeleterBase {
    typedef typename UniquePtr::pointer Pointer;
    typedef typename UniquePtr::deleter_type Deleter;

    explicit UniquePtrDeleter(Deleter deleter) : deleter_(std::move(deleter)) {}
    void dispose(void* p) override {
      try {
        deleter_(static_cast<Pointer>(p));
        delete this;
      } catch (...) {
        abort();
      }
    }

   private:
    Deleter deleter_;
  };

  static void freeUniquePtrBuffer(void* ptr, void* userData) {
    static_cast<DeleterBase*>(userData)->dispose(ptr);
  }
};

/**
 * Hasher for IOBuf objects. Hashes the entire chain using SpookyHashV2.
 */
struct IOBufHash {
  size_t operator()(const IOBuf& buf) const noexcept;
  size_t operator()(const std::unique_ptr<IOBuf>& buf) const noexcept {
    return buf ? (*this)(*buf) : 0;
  }
};

/**
 * Ordering for IOBuf objects. Compares data in the entire chain.
 */
struct IOBufCompare {
  ordering operator()(const IOBuf& a, const IOBuf& b) const {
    return &a == &b ? ordering::eq : impl(a, b);
  }
  ordering operator()(
      const std::unique_ptr<IOBuf>& a,
      const std::unique_ptr<IOBuf>& b) const {
    // clang-format off
    return
        !a && !b ? ordering::eq :
        !a && b ? ordering::lt :
        a && !b ? ordering::gt :
        operator()(*a, *b);
    // clang-format on
  }

 private:
  ordering impl(IOBuf const& a, IOBuf const& b) const noexcept;
};

/**
 * Equality predicate for IOBuf objects. Compares data in the entire chain.
 */
struct IOBufEqualTo : compare_equal_to<IOBufCompare> {};

/**
 * Inequality predicate for IOBuf objects. Compares data in the entire chain.
 */
struct IOBufNotEqualTo : compare_not_equal_to<IOBufCompare> {};

/**
 * Less predicate for IOBuf objects. Compares data in the entire chain.
 */
struct IOBufLess : compare_less<IOBufCompare> {};

/**
 * At-most predicate for IOBuf objects. Compares data in the entire chain.
 */
struct IOBufLessEqual : compare_less_equal<IOBufCompare> {};

/**
 * Greater predicate for IOBuf objects. Compares data in the entire chain.
 */
struct IOBufGreater : compare_greater<IOBufCompare> {};

/**
 * At-least predicate for IOBuf objects. Compares data in the entire chain.
 */
struct IOBufGreaterEqual : compare_greater_equal<IOBufCompare> {};

template <class UniquePtr>
typename std::enable_if<
    detail::IsUniquePtrToSL<UniquePtr>::value,
    std::unique_ptr<IOBuf>>::type
IOBuf::takeOwnership(UniquePtr&& buf, size_t count) {
  size_t size = count * sizeof(typename UniquePtr::element_type);
  auto deleter = new UniquePtrDeleter<UniquePtr>(buf.get_deleter());
  return takeOwnership(
      buf.release(), size, &IOBuf::freeUniquePtrBuffer, deleter);
}

inline std::unique_ptr<IOBuf> IOBuf::copyBuffer(
    const void* data,
    std::size_t size,
    std::size_t headroom,
    std::size_t minTailroom) {
  std::size_t capacity = headroom + size + minTailroom;
  std::unique_ptr<IOBuf> buf = create(capacity);
  buf->advance(headroom);
  if (size != 0) {
    memcpy(buf->writableData(), data, size);
  }
  buf->append(size);
  return buf;
}

inline std::unique_ptr<IOBuf> IOBuf::copyBuffer(
    const std::string& buf,
    std::size_t headroom,
    std::size_t minTailroom) {
  return copyBuffer(buf.data(), buf.size(), headroom, minTailroom);
}

inline std::unique_ptr<IOBuf> IOBuf::maybeCopyBuffer(
    const std::string& buf,
    std::size_t headroom,
    std::size_t minTailroom) {
  if (buf.empty()) {
    return nullptr;
  }
  return copyBuffer(buf.data(), buf.size(), headroom, minTailroom);
}

class IOBuf::Iterator
    : public detail::IteratorFacade<IOBuf::Iterator, ByteRange const> {
 public:
  // Note that IOBufs are stored as a circular list without a guard node,
  // so pos == end is ambiguous (it may mean "begin" or "end").  To solve
  // the ambiguity (at the cost of one extra comparison in the "increment"
  // code path), we define end iterators as having pos_ == end_ == nullptr
  // and we only allow forward iteration.
  explicit Iterator(const IOBuf* pos, const IOBuf* end) : pos_(pos), end_(end) {
    // Sadly, we must return by const reference, not by value.
    if (pos_) {
      setVal();
    }
  }

  Iterator() {}

  Iterator(Iterator const& rhs) : Iterator(rhs.pos_, rhs.end_) {}

  Iterator& operator=(Iterator const& rhs) {
    pos_ = rhs.pos_;
    end_ = rhs.end_;
    if (pos_) {
      setVal();
    }
    return *this;
  }

  const ByteRange& dereference() const {
    return val_;
  }

  bool equal(const Iterator& other) const {
    // We must compare end_ in addition to pos_, because forward traversal
    // requires that if two iterators are equal (a == b) and dereferenceable,
    // then ++a == ++b.
    return pos_ == other.pos_ && end_ == other.end_;
  }

  void increment() {
    pos_ = pos_->next();
    adjustForEnd();
  }

 private:
  void setVal() {
    val_ = ByteRange(pos_->data(), pos_->tail());
  }

  void adjustForEnd() {
    if (pos_ == end_) {
      pos_ = end_ = nullptr;
      val_ = ByteRange();
    } else {
      setVal();
    }
  }

  const IOBuf* pos_{nullptr};
  const IOBuf* end_{nullptr};
  ByteRange val_;
};

inline IOBuf::Iterator IOBuf::begin() const {
  return cbegin();
}
inline IOBuf::Iterator IOBuf::end() const {
  return cend();
}

} // namespace folly

FOLLY_POP_WARNING
