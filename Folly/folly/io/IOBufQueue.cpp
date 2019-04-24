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

#include <folly/io/IOBufQueue.h>

#include <string.h>

#include <stdexcept>

using std::make_pair;
using std::pair;
using std::unique_ptr;

namespace {

using folly::IOBuf;

const size_t MIN_ALLOC_SIZE = 2000;
const size_t MAX_ALLOC_SIZE = 8000;
const size_t MAX_PACK_COPY = 4096;

/**
 * Convenience function to append chain src to chain dst.
 */
void appendToChain(unique_ptr<IOBuf>& dst, unique_ptr<IOBuf>&& src, bool pack) {
  if (dst == nullptr) {
    dst = std::move(src);
  } else {
    IOBuf* tail = dst->prev();
    if (pack) {
      // Copy up to MAX_PACK_COPY bytes if we can free buffers; this helps
      // reduce wastage (the tail's tailroom and the head's headroom) when
      // joining two IOBufQueues together.
      size_t copyRemaining = MAX_PACK_COPY;
      std::size_t n;
      while (src && (n = src->length()) < copyRemaining &&
             n < tail->tailroom() && n > 0) {
        memcpy(tail->writableTail(), src->data(), n);
        tail->append(n);
        copyRemaining -= n;
        src = src->pop();
      }
    }
    if (src) {
      tail->appendChain(std::move(src));
    }
  }
}

} // namespace

namespace folly {

IOBufQueue::IOBufQueue(const Options& options)
    : options_(options), cachePtr_(&localCache_) {
  localCache_.attached = true;
}

IOBufQueue::~IOBufQueue() {
  clearWritableRangeCache();
}

IOBufQueue::IOBufQueue(IOBufQueue&& other) noexcept
    : options_(other.options_), cachePtr_(&localCache_) {
  other.clearWritableRangeCache();
  head_ = std::move(other.head_);
  chainLength_ = other.chainLength_;

  tailStart_ = other.tailStart_;
  localCache_.cachedRange = other.localCache_.cachedRange;
  localCache_.attached = true;

  other.chainLength_ = 0;
  other.tailStart_ = nullptr;
  other.localCache_.cachedRange = {nullptr, nullptr};
}

IOBufQueue& IOBufQueue::operator=(IOBufQueue&& other) {
  if (&other != this) {
    other.clearWritableRangeCache();
    clearWritableRangeCache();

    options_ = other.options_;
    head_ = std::move(other.head_);
    chainLength_ = other.chainLength_;

    tailStart_ = other.tailStart_;
    localCache_.cachedRange = other.localCache_.cachedRange;
    localCache_.attached = true;

    other.chainLength_ = 0;
    other.tailStart_ = nullptr;
    other.localCache_.cachedRange = {nullptr, nullptr};
  }
  return *this;
}

std::pair<void*, std::size_t> IOBufQueue::headroom() {
  // Note, headroom is independent from the tail, so we don't need to flush the
  // cache.
  if (head_) {
    return std::make_pair(head_->writableBuffer(), head_->headroom());
  } else {
    return std::make_pair(nullptr, 0);
  }
}

void IOBufQueue::markPrepended(std::size_t n) {
  if (n == 0) {
    return;
  }
  // Note, headroom is independent from the tail, so we don't need to flush the
  // cache.
  assert(head_);
  head_->prepend(n);
  chainLength_ += n;
}

void IOBufQueue::prepend(const void* buf, std::size_t n) {
  // We're not touching the tail, so we don't need to flush the cache.
  auto hroom = head_->headroom();
  if (!head_ || hroom < n) {
    throw std::overflow_error("Not enough room to prepend");
  }
  memcpy(head_->writableBuffer() + hroom - n, buf, n);
  head_->prepend(n);
  chainLength_ += n;
}

void IOBufQueue::append(unique_ptr<IOBuf>&& buf, bool pack) {
  if (!buf) {
    return;
  }
  auto guard = updateGuard();
  if (options_.cacheChainLength) {
    chainLength_ += buf->computeChainDataLength();
  }
  appendToChain(head_, std::move(buf), pack);
}

void IOBufQueue::append(IOBufQueue& other, bool pack) {
  if (!other.head_) {
    return;
  }
  // We're going to chain other, thus we need to grab both guards.
  auto otherGuard = other.updateGuard();
  auto guard = updateGuard();
  if (options_.cacheChainLength) {
    if (other.options_.cacheChainLength) {
      chainLength_ += other.chainLength_;
    } else {
      chainLength_ += other.head_->computeChainDataLength();
    }
  }
  appendToChain(head_, std::move(other.head_), pack);
  other.chainLength_ = 0;
}

void IOBufQueue::append(const void* buf, size_t len) {
  auto guard = updateGuard();
  auto src = static_cast<const uint8_t*>(buf);
  while (len != 0) {
    if ((head_ == nullptr) || head_->prev()->isSharedOne() ||
        (head_->prev()->tailroom() == 0)) {
      appendToChain(
          head_,
          IOBuf::create(
              std::max(MIN_ALLOC_SIZE, std::min(len, MAX_ALLOC_SIZE))),
          false);
    }
    IOBuf* last = head_->prev();
    std::size_t copyLen = std::min(len, (size_t)last->tailroom());
    memcpy(last->writableTail(), src, copyLen);
    src += copyLen;
    last->append(copyLen);
    chainLength_ += copyLen;
    len -= copyLen;
  }
}

void IOBufQueue::wrapBuffer(
    const void* buf,
    size_t len,
    std::size_t blockSize) {
  auto src = static_cast<const uint8_t*>(buf);
  while (len != 0) {
    size_t n = std::min(len, size_t(blockSize));
    append(IOBuf::wrapBuffer(src, n));
    src += n;
    len -= n;
  }
}

pair<void*, std::size_t> IOBufQueue::preallocateSlow(
    std::size_t min,
    std::size_t newAllocationSize,
    std::size_t max) {
  // Avoid grabbing update guard, since we're manually setting the cache ptrs.
  flushCache();
  // Allocate a new buffer of the requested max size.
  unique_ptr<IOBuf> newBuf(IOBuf::create(std::max(min, newAllocationSize)));

  tailStart_ = newBuf->writableTail();
  cachePtr_->cachedRange = std::pair<uint8_t*, uint8_t*>(
      tailStart_, tailStart_ + newBuf->tailroom());
  appendToChain(head_, std::move(newBuf), false);
  return make_pair(writableTail(), std::min<std::size_t>(max, tailroom()));
}

unique_ptr<IOBuf> IOBufQueue::split(size_t n, bool throwOnUnderflow) {
  auto guard = updateGuard();
  unique_ptr<IOBuf> result;
  while (n != 0) {
    if (head_ == nullptr) {
      if (throwOnUnderflow) {
        throw std::underflow_error(
            "Attempt to remove more bytes than are present in IOBufQueue");
      } else {
        break;
      }
    } else if (head_->length() <= n) {
      n -= head_->length();
      chainLength_ -= head_->length();
      unique_ptr<IOBuf> remainder = head_->pop();
      appendToChain(result, std::move(head_), false);
      head_ = std::move(remainder);
    } else {
      unique_ptr<IOBuf> clone = head_->cloneOne();
      clone->trimEnd(clone->length() - n);
      appendToChain(result, std::move(clone), false);
      head_->trimStart(n);
      chainLength_ -= n;
      break;
    }
  }
  if (UNLIKELY(result == nullptr)) {
    return IOBuf::create(0);
  }
  return result;
}

void IOBufQueue::trimStart(size_t amount) {
  auto trimmed = trimStartAtMost(amount);
  if (trimmed != amount) {
    throw std::underflow_error(
        "Attempt to trim more bytes than are present in IOBufQueue");
  }
}

size_t IOBufQueue::trimStartAtMost(size_t amount) {
  auto guard = updateGuard();
  auto original = amount;
  while (amount > 0) {
    if (!head_) {
      break;
    }
    if (head_->length() > amount) {
      head_->trimStart(amount);
      chainLength_ -= amount;
      amount = 0;
      break;
    }
    amount -= head_->length();
    chainLength_ -= head_->length();
    head_ = head_->pop();
  }
  return original - amount;
}

void IOBufQueue::trimEnd(size_t amount) {
  auto trimmed = trimEndAtMost(amount);
  if (trimmed != amount) {
    throw std::underflow_error(
        "Attempt to trim more bytes than are present in IOBufQueue");
  }
}

size_t IOBufQueue::trimEndAtMost(size_t amount) {
  auto guard = updateGuard();
  auto original = amount;
  while (amount > 0) {
    if (!head_) {
      break;
    }
    if (head_->prev()->length() > amount) {
      head_->prev()->trimEnd(amount);
      chainLength_ -= amount;
      amount = 0;
      break;
    }
    amount -= head_->prev()->length();
    chainLength_ -= head_->prev()->length();

    if (head_->isChained()) {
      head_->prev()->unlink();
    } else {
      head_.reset();
    }
  }
  return original - amount;
}

std::unique_ptr<folly::IOBuf> IOBufQueue::pop_front() {
  auto guard = updateGuard();
  if (!head_) {
    return nullptr;
  }
  chainLength_ -= head_->length();
  std::unique_ptr<folly::IOBuf> retBuf = std::move(head_);
  head_ = retBuf->pop();
  return retBuf;
}

void IOBufQueue::clear() {
  if (!head_) {
    return;
  }
  auto guard = updateGuard();
  IOBuf* buf = head_.get();
  do {
    buf->clear();
    buf = buf->next();
  } while (buf != head_.get());
  chainLength_ = 0;
}

void IOBufQueue::appendToString(std::string& out) const {
  if (!head_) {
    return;
  }
  auto len = options_.cacheChainLength
      ? chainLength_ + (cachePtr_->cachedRange.first - tailStart_)
      : head_->computeChainDataLength() +
          (cachePtr_->cachedRange.first - tailStart_);
  out.reserve(out.size() + len);

  for (auto range : *head_) {
    out.append(reinterpret_cast<const char*>(range.data()), range.size());
  }

  if (tailStart_ != cachePtr_->cachedRange.first) {
    out.append(
        reinterpret_cast<const char*>(tailStart_),
        cachePtr_->cachedRange.first - tailStart_);
  }
}

void IOBufQueue::gather(std::size_t maxLength) {
  auto guard = updateGuard();
  if (head_ != nullptr) {
    head_->gather(maxLength);
  }
}

} // namespace folly
