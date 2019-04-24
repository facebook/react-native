/*
 * Copyright 2012-present Facebook, Inc.
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

#include <folly/Likely.h>
#include <folly/stats/BucketedTimeSeries.h>
#include <glog/logging.h>
#include <algorithm>
#include <stdexcept>

namespace folly {

template <typename VT, typename CT>
BucketedTimeSeries<VT, CT>::BucketedTimeSeries(
    size_t nBuckets,
    Duration maxDuration)
    : firstTime_(Duration(1)), latestTime_(), duration_(maxDuration) {
  // For tracking all-time data we only use total_, and don't need to bother
  // with buckets_
  if (!isAllTime()) {
    // Round nBuckets down to duration_.count().
    //
    // There is no point in having more buckets than our timestamp
    // granularity: otherwise we would have buckets that could never be used.
    if (nBuckets > size_t(duration_.count())) {
      nBuckets = size_t(duration_.count());
    }

    buckets_.resize(nBuckets, Bucket());
  }
}

template <typename VT, typename CT>
BucketedTimeSeries<VT, CT>::BucketedTimeSeries(
    TimePoint theFirstTime,
    TimePoint theLatestTime,
    Duration maxDuration,
    const std::vector<Bucket>& bucketsList)
    : firstTime_(theFirstTime),
      latestTime_(theLatestTime),
      duration_(maxDuration),
      buckets_(bucketsList) {
  // Come up with the total_ from buckets_ being passed in
  for (auto const& bucket : buckets_) {
    total_.add(bucket.sum, bucket.count);
  }

  // Verify the integrity of the data

  // If firstTime is greater than latestTime, the total count should be 0.
  // (firstTime being greater than latestTime means that no data points have
  // ever been added to the time series.)
  if (firstTime_ > latestTime_ && (total_.sum != 0 || total_.count != 0)) {
    throw std::invalid_argument(
        "The total should have been 0 "
        "if firstTime is greater than lastestTime");
  }

  // If firstTime is less than or equal to latestTime,
  // latestTime - firstTime should be less than or equal to the duration.
  if (firstTime_ <= latestTime_ && latestTime_ - firstTime_ > duration_) {
    throw std::invalid_argument(
        "The difference between firstTime and latestTime "
        "should be less than or equal to the duration");
  }
}

template <typename VT, typename CT>
bool BucketedTimeSeries<VT, CT>::addValue(TimePoint now, const ValueType& val) {
  return addValueAggregated(now, val, 1);
}

template <typename VT, typename CT>
bool BucketedTimeSeries<VT, CT>::addValue(
    TimePoint now,
    const ValueType& val,
    uint64_t times) {
  return addValueAggregated(now, val * ValueType(times), times);
}

template <typename VT, typename CT>
bool BucketedTimeSeries<VT, CT>::addValueAggregated(
    TimePoint now,
    const ValueType& total,
    uint64_t nsamples) {
  if (isAllTime()) {
    if (UNLIKELY(empty())) {
      firstTime_ = now;
      latestTime_ = now;
    } else if (now > latestTime_) {
      latestTime_ = now;
    } else if (now < firstTime_) {
      firstTime_ = now;
    }
    total_.add(total, nsamples);
    return true;
  }

  size_t bucketIdx;
  if (UNLIKELY(empty())) {
    // First data point we've ever seen
    firstTime_ = now;
    latestTime_ = now;
    bucketIdx = getBucketIdx(now);
  } else if (now > latestTime_) {
    // More recent time.  Need to update the buckets.
    bucketIdx = updateBuckets(now);
  } else if (LIKELY(now == latestTime_)) {
    // Current time.
    bucketIdx = getBucketIdx(now);
  } else {
    // An earlier time in the past.  We need to check if this time still falls
    // within our window.
    if (now < getEarliestTimeNonEmpty()) {
      return false;
    }
    bucketIdx = getBucketIdx(now);
  }

  total_.add(total, nsamples);
  buckets_[bucketIdx].add(total, nsamples);
  return true;
}

template <typename VT, typename CT>
size_t BucketedTimeSeries<VT, CT>::update(TimePoint now) {
  if (empty()) {
    // This is the first data point.
    firstTime_ = now;
  }

  // For all-time data, all we need to do is update latestTime_
  if (isAllTime()) {
    latestTime_ = std::max(latestTime_, now);
    return 0;
  }

  // Make sure time doesn't go backwards.
  // If the time is less than or equal to the latest time we have already seen,
  // we don't need to do anything.
  if (now <= latestTime_) {
    return getBucketIdx(latestTime_);
  }

  return updateBuckets(now);
}

template <typename VT, typename CT>
size_t BucketedTimeSeries<VT, CT>::updateBuckets(TimePoint now) {
  // We could cache nextBucketStart as a member variable, so we don't have to
  // recompute it each time update() is called with a new timestamp value.
  // This makes things faster when update() (or addValue()) is called once
  // per second, but slightly slower when update() is called multiple times a
  // second.  We care more about optimizing the cases where addValue() is being
  // called frequently.  If addValue() is only being called once every few
  // seconds, it doesn't matter as much if it is fast.

  // Get info about the bucket that latestTime_ points at
  size_t currentBucket;
  TimePoint currentBucketStart;
  TimePoint nextBucketStart;
  getBucketInfo(
      latestTime_, &currentBucket, &currentBucketStart, &nextBucketStart);

  // Update latestTime_
  latestTime_ = now;

  if (now < nextBucketStart) {
    // We're still in the same bucket.
    // We're done after updating latestTime_.
    return currentBucket;
  } else if (now >= currentBucketStart + duration_) {
    // It's been a while.  We have wrapped, and all of the buckets need to be
    // cleared.
    for (Bucket& bucket : buckets_) {
      bucket.clear();
    }
    total_.clear();
    return getBucketIdx(latestTime_);
  } else {
    // clear all the buckets between the last time and current time, meaning
    // buckets in the range [(currentBucket+1), newBucket]. Note that
    // the bucket (currentBucket+1) is always the oldest bucket we have. Since
    // our array is circular, loop when we reach the end.
    size_t newBucket = getBucketIdx(now);
    size_t idx = currentBucket;
    while (idx != newBucket) {
      ++idx;
      if (idx >= buckets_.size()) {
        idx = 0;
      }
      total_ -= buckets_[idx];
      buckets_[idx].clear();
    }
    return newBucket;
  }
}

template <typename VT, typename CT>
void BucketedTimeSeries<VT, CT>::clear() {
  for (Bucket& bucket : buckets_) {
    bucket.clear();
  }
  total_.clear();
  // Set firstTime_ larger than latestTime_,
  // to indicate that the timeseries is empty
  firstTime_ = TimePoint(Duration(1));
  latestTime_ = TimePoint();
}

template <typename VT, typename CT>
typename CT::time_point BucketedTimeSeries<VT, CT>::getEarliestTime() const {
  if (empty()) {
    return TimePoint();
  }
  if (isAllTime()) {
    return firstTime_;
  }

  // Compute the earliest time we can track
  TimePoint earliestTime = getEarliestTimeNonEmpty();

  // We're never tracking data before firstTime_
  earliestTime = std::max(earliestTime, firstTime_);

  return earliestTime;
}

template <typename VT, typename CT>
typename CT::time_point BucketedTimeSeries<VT, CT>::getEarliestTimeNonEmpty()
    const {
  size_t currentBucket;
  TimePoint currentBucketStart;
  TimePoint nextBucketStart;
  getBucketInfo(
      latestTime_, &currentBucket, &currentBucketStart, &nextBucketStart);

  // Subtract 1 duration from the start of the next bucket to find the
  // earliest possible data point we could be tracking.
  return nextBucketStart - duration_;
}

template <typename VT, typename CT>
typename CT::duration BucketedTimeSeries<VT, CT>::elapsed() const {
  if (empty()) {
    return Duration(0);
  }

  // Add 1 since [latestTime_, earliestTime] is an inclusive interval.
  return latestTime_ - getEarliestTime() + Duration(1);
}

template <typename VT, typename CT>
typename CT::duration BucketedTimeSeries<VT, CT>::elapsed(
    TimePoint start,
    TimePoint end) const {
  if (empty()) {
    return Duration(0);
  }
  start = std::max(start, getEarliestTime());
  end = std::min(end, latestTime_ + Duration(1));
  end = std::max(start, end);
  return end - start;
}

template <typename VT, typename CT>
VT BucketedTimeSeries<VT, CT>::sum(TimePoint start, TimePoint end) const {
  ValueType total = ValueType();
  forEachBucket(
      start,
      end,
      [&](const Bucket& bucket,
          TimePoint bucketStart,
          TimePoint nextBucketStart) -> bool {
        total += this->rangeAdjust(
            bucketStart, nextBucketStart, start, end, bucket.sum);
        return true;
      });

  return total;
}

template <typename VT, typename CT>
uint64_t BucketedTimeSeries<VT, CT>::count(TimePoint start, TimePoint end)
    const {
  uint64_t sample_count = 0;
  forEachBucket(
      start,
      end,
      [&](const Bucket& bucket,
          TimePoint bucketStart,
          TimePoint nextBucketStart) -> bool {
        sample_count += this->rangeAdjust(
            bucketStart, nextBucketStart, start, end, ValueType(bucket.count));
        return true;
      });

  return sample_count;
}

template <typename VT, typename CT>
template <typename ReturnType>
ReturnType BucketedTimeSeries<VT, CT>::avg(TimePoint start, TimePoint end)
    const {
  ValueType total = ValueType();
  uint64_t sample_count = 0;
  forEachBucket(
      start,
      end,
      [&](const Bucket& bucket,
          TimePoint bucketStart,
          TimePoint nextBucketStart) -> bool {
        total += this->rangeAdjust(
            bucketStart, nextBucketStart, start, end, bucket.sum);
        sample_count += this->rangeAdjust(
            bucketStart, nextBucketStart, start, end, ValueType(bucket.count));
        return true;
      });

  if (sample_count == 0) {
    return ReturnType(0);
  }

  return detail::avgHelper<ReturnType>(total, sample_count);
}

/*
 * A note about some of the bucket index calculations below:
 *
 * buckets_.size() may not divide evenly into duration_.  When this happens,
 * some buckets will be wider than others.  We still want to spread the data
 * out as evenly as possible among the buckets (as opposed to just making the
 * last bucket be significantly wider than all of the others).
 *
 * To make the division work out, we pretend that the buckets are each
 * duration_ wide, so that the overall duration becomes
 * buckets.size() * duration_.
 *
 * To transform a real timestamp into the scale used by our buckets,
 * we have to multiply by buckets_.size().  To figure out which bucket it goes
 * into, we then divide by duration_.
 */

template <typename VT, typename CT>
size_t BucketedTimeSeries<VT, CT>::getBucketIdx(TimePoint time) const {
  // For all-time data we don't use buckets_.  Everything is tracked in total_.
  DCHECK(!isAllTime());

  auto timeIntoCurrentCycle = (time.time_since_epoch() % duration_);
  return timeIntoCurrentCycle.count() * buckets_.size() / duration_.count();
}

/*
 * Compute the bucket index for the specified time, as well as the earliest
 * time that falls into this bucket.
 */
template <typename VT, typename CT>
void BucketedTimeSeries<VT, CT>::getBucketInfo(
    TimePoint time,
    size_t* bucketIdx,
    TimePoint* bucketStart,
    TimePoint* nextBucketStart) const {
  typedef typename Duration::rep TimeInt;
  DCHECK(!isAllTime());

  // Keep these two lines together.  The compiler should be able to compute
  // both the division and modulus with a single operation.
  Duration timeMod = time.time_since_epoch() % duration_;
  TimeInt numFullDurations = time.time_since_epoch() / duration_;

  TimeInt scaledTime = timeMod.count() * TimeInt(buckets_.size());

  // Keep these two lines together.  The compiler should be able to compute
  // both the division and modulus with a single operation.
  *bucketIdx = size_t(scaledTime / duration_.count());
  TimeInt scaledOffsetInBucket = scaledTime % duration_.count();

  TimeInt scaledBucketStart = scaledTime - scaledOffsetInBucket;
  TimeInt scaledNextBucketStart = scaledBucketStart + duration_.count();

  Duration bucketStartMod(
      (scaledBucketStart + buckets_.size() - 1) / buckets_.size());
  Duration nextBucketStartMod(
      (scaledNextBucketStart + buckets_.size() - 1) / buckets_.size());

  TimePoint durationStart(numFullDurations * duration_);
  *bucketStart = bucketStartMod + durationStart;
  *nextBucketStart = nextBucketStartMod + durationStart;
}

template <typename VT, typename CT>
template <typename Function>
void BucketedTimeSeries<VT, CT>::forEachBucket(Function fn) const {
  if (isAllTime()) {
    fn(total_, firstTime_, latestTime_ + Duration(1));
    return;
  }

  typedef typename Duration::rep TimeInt;

  // Compute durationStart, latestBucketIdx, and scaledNextBucketStart,
  // the same way as in getBucketInfo().
  Duration timeMod = latestTime_.time_since_epoch() % duration_;
  TimeInt numFullDurations = latestTime_.time_since_epoch() / duration_;
  TimePoint durationStart(numFullDurations * duration_);
  TimeInt scaledTime = timeMod.count() * TimeInt(buckets_.size());
  size_t latestBucketIdx = size_t(scaledTime / duration_.count());
  TimeInt scaledOffsetInBucket = scaledTime % duration_.count();
  TimeInt scaledBucketStart = scaledTime - scaledOffsetInBucket;
  TimeInt scaledNextBucketStart = scaledBucketStart + duration_.count();

  // Walk through the buckets, starting one past the current bucket.
  // The next bucket is from the previous cycle, so subtract 1 duration
  // from durationStart.
  size_t idx = latestBucketIdx;
  durationStart -= duration_;

  TimePoint nextBucketStart =
      Duration(
          (scaledNextBucketStart + buckets_.size() - 1) / buckets_.size()) +
      durationStart;
  while (true) {
    ++idx;
    if (idx >= buckets_.size()) {
      idx = 0;
      durationStart += duration_;
      scaledNextBucketStart = duration_.count();
    } else {
      scaledNextBucketStart += duration_.count();
    }

    TimePoint bucketStart = nextBucketStart;
    nextBucketStart =
        Duration(
            (scaledNextBucketStart + buckets_.size() - 1) / buckets_.size()) +
        durationStart;

    // Should we bother skipping buckets where firstTime_ >= nextBucketStart?
    // For now we go ahead and invoke the function with these buckets.
    // sum and count should always be 0 in these buckets.

    DCHECK_LE(
        bucketStart.time_since_epoch().count(),
        latestTime_.time_since_epoch().count());
    bool ret = fn(buckets_[idx], bucketStart, nextBucketStart);
    if (!ret) {
      break;
    }

    if (idx == latestBucketIdx) {
      // all done
      break;
    }
  }
}

/*
 * Adjust the input value from the specified bucket to only account
 * for the desired range.
 *
 * For example, if the bucket spans time [10, 20), but we only care about the
 * range [10, 16), this will return 60% of the input value.
 */
template <typename VT, typename CT>
VT BucketedTimeSeries<VT, CT>::rangeAdjust(
    TimePoint bucketStart,
    TimePoint nextBucketStart,
    TimePoint start,
    TimePoint end,
    ValueType input) const {
  // If nextBucketStart is greater than latestTime_, treat nextBucketStart as
  // if it were latestTime_.  This makes us more accurate when someone is
  // querying for all of the data up to latestTime_.  Even though latestTime_
  // may only be partially through the bucket, we don't want to adjust
  // downwards in this case, because the bucket really only has data up to
  // latestTime_.
  if (bucketStart <= latestTime_ && nextBucketStart > latestTime_) {
    nextBucketStart = latestTime_ + Duration(1);
  }

  if (start <= bucketStart && end >= nextBucketStart) {
    // The bucket is wholly contained in the [start, end) interval
    return input;
  }

  TimePoint intervalStart = std::max(start, bucketStart);
  TimePoint intervalEnd = std::min(end, nextBucketStart);
  return input * (intervalEnd - intervalStart) /
      (nextBucketStart - bucketStart);
}

template <typename VT, typename CT>
template <typename Function>
void BucketedTimeSeries<VT, CT>::forEachBucket(
    TimePoint start,
    TimePoint end,
    Function fn) const {
  forEachBucket(
      [&start, &end, &fn](
          const Bucket& bucket,
          TimePoint bucketStart,
          TimePoint nextBucketStart) -> bool {
        if (start >= nextBucketStart) {
          return true;
        }
        if (end <= bucketStart) {
          return false;
        }
        bool ret = fn(bucket, bucketStart, nextBucketStart);
        return ret;
      });
}

} // namespace folly
