/*
 * Copyright 2017-present Facebook, Inc.
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

#include <folly/executors/Codel.h>

#include <folly/portability/GFlags.h>
#include <algorithm>

DEFINE_int32(codel_interval, 100, "Codel default interval time in ms");
DEFINE_int32(codel_target_delay, 5, "Target codel queueing delay in ms");

using namespace std::chrono;

namespace folly {

Codel::Codel()
    : codelMinDelayNs_(0),
      codelIntervalTimeNs_(
          duration_cast<nanoseconds>(steady_clock::now().time_since_epoch())
              .count()),
      codelResetDelay_(true),
      overloaded_(false) {}

bool Codel::overloaded(nanoseconds delay) {
  bool ret = false;
  auto now = steady_clock::now();

  // Avoid another thread updating the value at the same time we are using it
  // to calculate the overloaded state
  auto minDelay = nanoseconds(codelMinDelayNs_);

  if (now > steady_clock::time_point(nanoseconds(codelIntervalTimeNs_)) &&
      // testing before exchanging is more cacheline-friendly
      (!codelResetDelay_.load(std::memory_order_acquire) &&
       !codelResetDelay_.exchange(true))) {
    codelIntervalTimeNs_ =
        duration_cast<nanoseconds>((now + getInterval()).time_since_epoch())
            .count();

    if (minDelay > getTargetDelay()) {
      overloaded_ = true;
    } else {
      overloaded_ = false;
    }
  }
  // Care must be taken that only a single thread resets codelMinDelay_,
  // and that it happens after the interval reset above
  if (codelResetDelay_.load(std::memory_order_acquire) &&
      codelResetDelay_.exchange(false)) {
    codelMinDelayNs_ = delay.count();
    // More than one request must come in during an interval before codel
    // starts dropping requests
    return false;
  } else if (delay < nanoseconds(codelMinDelayNs_)) {
    codelMinDelayNs_ = delay.count();
  }

  // Here is where we apply different logic than codel proper. Instead of
  // adapting the interval until the next drop, we slough off requests with
  // queueing delay > 2*target_delay while in the overloaded regime. This
  // empirically works better for our services than the codel approach of
  // increasingly often dropping packets.
  if (overloaded_ && delay > getSloughTimeout()) {
    ret = true;
  }

  return ret;
}

int Codel::getLoad() {
  // it might be better to use the average delay instead of minDelay, but we'd
  // have to track it. aspiring bootcamper?
  return std::min<int>(100, 100 * getMinDelay() / getSloughTimeout());
}

nanoseconds Codel::getMinDelay() {
  return nanoseconds(codelMinDelayNs_);
}

milliseconds Codel::getInterval() {
  return milliseconds(FLAGS_codel_interval);
}

milliseconds Codel::getTargetDelay() {
  return milliseconds(FLAGS_codel_target_delay);
}

milliseconds Codel::getSloughTimeout() {
  return getTargetDelay() * 2;
}

} // namespace folly
