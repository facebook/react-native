/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/io/async/HHWheelTimer.h>

#include <cassert>

#include <folly/Memory.h>
#include <folly/Optional.h>
#include <folly/ScopeGuard.h>
#include <folly/container/BitIterator.h>
#include <folly/io/async/Request.h>
#include <folly/lang/Bits.h>

using std::chrono::milliseconds;

namespace folly {

/**
 * We want to select the default interval carefully.
 * An interval of 10ms will give us 10ms * WHEEL_SIZE^WHEEL_BUCKETS
 * for the largest timeout possible, or about 497 days.
 *
 * For a lower bound, we want a reasonable limit on local IO, 10ms
 * seems short enough
 *
 * A shorter interval also has CPU implications, less than 1ms might
 * start showing up in cpu perf.  Also, it might not be possible to set
 * tick interval less than 10ms on older kernels.
 */
int HHWheelTimer::DEFAULT_TICK_INTERVAL = 10;

HHWheelTimer::Callback::~Callback() {
  if (isScheduled()) {
    cancelTimeout();
  }
}

void HHWheelTimer::Callback::setScheduled(
    HHWheelTimer* wheel,
    std::chrono::milliseconds timeout) {
  assert(wheel_ == nullptr);
  assert(expiration_ == decltype(expiration_){});

  wheel_ = wheel;

  expiration_ = getCurTime() + timeout;
}

void HHWheelTimer::Callback::cancelTimeoutImpl() {
  if (--wheel_->count_ <= 0) {
    assert(wheel_->count_ == 0);
    wheel_->AsyncTimeout::cancelTimeout();
  }
  unlink();
  if ((-1 != bucket_) && (wheel_->buckets_[0][bucket_].empty())) {
    auto bi = makeBitIterator(wheel_->bitmap_.begin());
    *(bi + bucket_) = false;
  }

  wheel_ = nullptr;
  expiration_ = {};
}

HHWheelTimer::HHWheelTimer(
    folly::TimeoutManager* timeoutMananger,
    std::chrono::milliseconds intervalMS,
    AsyncTimeout::InternalEnum internal,
    std::chrono::milliseconds defaultTimeoutMS)
    : AsyncTimeout(timeoutMananger, internal),
      interval_(intervalMS),
      defaultTimeout_(defaultTimeoutMS),
      lastTick_(1),
      expireTick_(1),
      count_(0),
      startTime_(getCurTime()),
      processingCallbacksGuard_(nullptr) {
  bitmap_.resize((WHEEL_SIZE / sizeof(std::size_t)) / 8, 0);
}

HHWheelTimer::~HHWheelTimer() {
  // Ensure this gets done, but right before destruction finishes.
  auto destructionPublisherGuard = folly::makeGuard([&] {
    // Inform the subscriber that this instance is doomed.
    if (processingCallbacksGuard_) {
      *processingCallbacksGuard_ = true;
    }
  });
  while (!timeouts.empty()) {
    auto* cb = &timeouts.front();
    timeouts.pop_front();
    cb->cancelTimeout();
    cb->callbackCanceled();
  }
  cancelAll();
}

void HHWheelTimer::scheduleTimeoutImpl(
    Callback* callback,
    std::chrono::milliseconds timeout) {
  auto nextTick = calcNextTick();
  int64_t due = timeToWheelTicks(timeout) + nextTick;
  int64_t diff = due - nextTick;
  CallbackList* list;

  auto bi = makeBitIterator(bitmap_.begin());

  if (diff < 0) {
    list = &buckets_[0][nextTick & WHEEL_MASK];
    *(bi + (nextTick & WHEEL_MASK)) = true;
    callback->bucket_ = nextTick & WHEEL_MASK;
  } else if (diff < WHEEL_SIZE) {
    list = &buckets_[0][due & WHEEL_MASK];
    *(bi + (due & WHEEL_MASK)) = true;
    callback->bucket_ = due & WHEEL_MASK;
  } else if (diff < 1 << (2 * WHEEL_BITS)) {
    list = &buckets_[1][(due >> WHEEL_BITS) & WHEEL_MASK];
  } else if (diff < 1 << (3 * WHEEL_BITS)) {
    list = &buckets_[2][(due >> 2 * WHEEL_BITS) & WHEEL_MASK];
  } else {
    /* in largest slot */
    if (diff > LARGEST_SLOT) {
      diff = LARGEST_SLOT;
      due = diff + nextTick;
    }
    list = &buckets_[3][(due >> 3 * WHEEL_BITS) & WHEEL_MASK];
  }
  list->push_back(*callback);
}

void HHWheelTimer::scheduleTimeout(
    Callback* callback,
    std::chrono::milliseconds timeout) {
  // Cancel the callback if it happens to be scheduled already.
  callback->cancelTimeout();

  callback->requestContext_ = RequestContext::saveContext();

  count_++;

  callback->setScheduled(this, timeout);
  scheduleTimeoutImpl(callback, timeout);

  /* If we're calling callbacks, timer will be reset after all
   * callbacks are called.
   */
  if (!processingCallbacksGuard_) {
    scheduleNextTimeout();
  }
}

void HHWheelTimer::scheduleTimeout(Callback* callback) {
  CHECK(std::chrono::milliseconds(-1) != defaultTimeout_)
      << "Default timeout was not initialized";
  scheduleTimeout(callback, defaultTimeout_);
}

bool HHWheelTimer::cascadeTimers(int bucket, int tick) {
  CallbackList cbs;
  cbs.swap(buckets_[bucket][tick]);
  while (!cbs.empty()) {
    auto* cb = &cbs.front();
    cbs.pop_front();
    scheduleTimeoutImpl(cb, cb->getTimeRemaining(getCurTime()));
  }

  // If tick is zero, timeoutExpired will cascade the next bucket.
  return tick == 0;
}

void HHWheelTimer::timeoutExpired() noexcept {
  auto nextTick = calcNextTick();

  // If the last smart pointer for "this" is reset inside the callback's
  // timeoutExpired(), then the guard will detect that it is time to bail from
  // this method.
  auto isDestroyed = false;
  // If scheduleTimeout is called from a callback in this function, it may
  // cause inconsistencies in the state of this object. As such, we need
  // to treat these calls slightly differently.
  CHECK(!processingCallbacksGuard_);
  processingCallbacksGuard_ = &isDestroyed;
  auto reEntryGuard = folly::makeGuard([&] {
    if (!isDestroyed) {
      processingCallbacksGuard_ = nullptr;
    }
  });

  // timeoutExpired() can only be invoked directly from the event base loop.
  // It should never be invoked recursively.
  //
  lastTick_ = expireTick_;
  while (lastTick_ < nextTick) {
    int idx = lastTick_ & WHEEL_MASK;

    auto bi = makeBitIterator(bitmap_.begin());
    *(bi + idx) = false;

    lastTick_++;
    CallbackList* cbs = &buckets_[0][idx];
    while (!cbs->empty()) {
      auto* cb = &cbs->front();
      cbs->pop_front();
      timeouts.push_back(*cb);
    }

    if (idx == 0) {
      // Cascade timers
      if (cascadeTimers(1, (lastTick_ >> WHEEL_BITS) & WHEEL_MASK) &&
          cascadeTimers(2, (lastTick_ >> (2 * WHEEL_BITS)) & WHEEL_MASK)) {
        cascadeTimers(3, (lastTick_ >> (3 * WHEEL_BITS)) & WHEEL_MASK);
      }
    }
  }

  while (!timeouts.empty()) {
    auto* cb = &timeouts.front();
    timeouts.pop_front();
    count_--;
    cb->wheel_ = nullptr;
    cb->expiration_ = {};
    RequestContextScopeGuard rctx(cb->requestContext_);
    cb->timeoutExpired();
    if (isDestroyed) {
      // The HHWheelTimer itself has been destroyed. The other callbacks
      // will have been cancelled from the destructor. Bail before causing
      // damage.
      return;
    }
  }
  scheduleNextTimeout();
}

size_t HHWheelTimer::cancelAll() {
  size_t count = 0;

  if (count_ != 0) {
    const std::size_t numElements = WHEEL_BUCKETS * WHEEL_SIZE;
    auto maxBuckets = std::min(numElements, count_);
    auto buckets = std::make_unique<CallbackList[]>(maxBuckets);
    size_t countBuckets = 0;
    for (auto& tick : buckets_) {
      for (auto& bucket : tick) {
        if (bucket.empty()) {
          continue;
        }
        count += bucket.size();
        std::swap(bucket, buckets[countBuckets++]);
        if (count >= count_) {
          break;
        }
      }
    }

    for (size_t i = 0; i < countBuckets; ++i) {
      auto& bucket = buckets[i];
      while (!bucket.empty()) {
        auto& cb = bucket.front();
        cb.cancelTimeout();
        cb.callbackCanceled();
      }
    }
  }

  return count;
}

void HHWheelTimer::scheduleNextTimeout() {
  auto nextTick = calcNextTick();
  int64_t tick = 1;

  if (nextTick & WHEEL_MASK) {
    auto bi = makeBitIterator(bitmap_.begin());
    auto bi_end = makeBitIterator(bitmap_.end());
    auto it = folly::findFirstSet(bi + (nextTick & WHEEL_MASK), bi_end);
    if (it == bi_end) {
      tick = WHEEL_SIZE - ((nextTick - 1) & WHEEL_MASK);
    } else {
      tick = std::distance(bi + (nextTick & WHEEL_MASK), it) + 1;
    }
  }

  if (count_ > 0) {
    if (!this->AsyncTimeout::isScheduled() ||
        (expireTick_ > tick + nextTick - 1)) {
      this->AsyncTimeout::scheduleTimeout(interval_ * tick);
      expireTick_ = tick + nextTick - 1;
    }
  } else {
    this->AsyncTimeout::cancelTimeout();
  }
}

int64_t HHWheelTimer::calcNextTick() {
  auto intervals = (getCurTime() - startTime_) / interval_;
  // Slow eventbases will have skew between the actual time and the
  // callback time.  To avoid racing the next scheduleNextTimeout()
  // call, always schedule new timeouts against the actual
  // timeoutExpired() time.
  if (!processingCallbacksGuard_) {
    return intervals;
  } else {
    return lastTick_;
  }
}

} // namespace folly
