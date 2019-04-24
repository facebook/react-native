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

#include <folly/stats/Histogram.h>
#include <folly/stats/MultiLevelTimeSeries.h>
#include <string>

namespace folly {

/*
 * TimeseriesHistogram tracks data distributions as they change over time.
 *
 * Specifically, it is a bucketed histogram with different value ranges assigned
 * to each bucket.  Within each bucket is a MultiLevelTimeSeries from
 * 'folly/stats/MultiLevelTimeSeries.h'. This means that each bucket contains a
 * different set of data for different historical time periods, and one can
 * query data distributions over different trailing time windows.
 *
 * For example, this can answer questions: "What is the data distribution over
 * the last minute? Over the last 10 minutes?  Since I last cleared this
 * histogram?"
 *
 * The class can also estimate percentiles and answer questions like: "What was
 * the 99th percentile data value over the last 10 minutes?"
 *
 * Note: that depending on the size of your buckets and the smoothness
 * of your data distribution, the estimate may be way off from the actual
 * value.  In particular, if the given percentile falls outside of the bucket
 * range (i.e. your buckets range in 0 - 100,000 but the 99th percentile is
 * around 115,000) this estimate may be very wrong.
 *
 * The memory usage for a typical histogram is roughly 3k * (# of buckets).  All
 * insertion operations are amortized O(1), and all queries are O(# of buckets).
 */
template <
    class T,
    class CT = LegacyStatsClock<std::chrono::seconds>,
    class C = folly::MultiLevelTimeSeries<T, CT>>
class TimeseriesHistogram {
 private:
  // NOTE: T must be equivalent to _signed_ numeric type for our math.
  static_assert(std::numeric_limits<T>::is_signed, "");

 public:
  // Values to be inserted into container
  using ValueType = T;
  // The container type we use internally for each bucket
  using ContainerType = C;
  // Clock, duration, and time point types
  using Clock = CT;
  using Duration = typename Clock::duration;
  using TimePoint = typename Clock::time_point;

  /*
   * Create a TimeSeries histogram and initialize the bucketing and levels.
   *
   * The buckets are created by chopping the range [min, max) into pieces
   * of size bucketSize, with the last bucket being potentially shorter.  Two
   * additional buckets are always created -- the "under" bucket for the range
   * (-inf, min) and the "over" bucket for the range [max, +inf).
   *
   * @param bucketSize the width of each bucket
   * @param min the smallest value for the bucket range.
   * @param max the largest value for the bucket range
   * @param defaultContainer a pre-initialized timeseries with the desired
   *                         number of levels and their durations.
   */
  TimeseriesHistogram(
      ValueType bucketSize,
      ValueType min,
      ValueType max,
      const ContainerType& defaultContainer);

  /* Return the bucket size of each bucket in the histogram. */
  ValueType getBucketSize() const {
    return buckets_.getBucketSize();
  }

  /* Return the min value at which bucketing begins. */
  ValueType getMin() const {
    return buckets_.getMin();
  }

  /* Return the max value at which bucketing ends. */
  ValueType getMax() const {
    return buckets_.getMax();
  }

  /* Return the number of levels of the Timeseries object in each bucket */
  size_t getNumLevels() const {
    return buckets_.getByIndex(0).numLevels();
  }

  /* Return the number of buckets */
  size_t getNumBuckets() const {
    return buckets_.getNumBuckets();
  }

  /*
   * Return the threshold of the bucket for the given index in range
   * [0..numBuckets).  The bucket will have range [thresh, thresh + bucketSize)
   * or [thresh, max), whichever is shorter.
   */
  ValueType getBucketMin(size_t bucketIdx) const {
    return buckets_.getBucketMin(bucketIdx);
  }

  /* Return the actual timeseries in the given bucket (for reading only!) */
  const ContainerType& getBucket(size_t bucketIdx) const {
    return buckets_.getByIndex(bucketIdx);
  }

  /* Total count of values at the given timeseries level (all buckets). */
  uint64_t count(size_t level) const {
    uint64_t total = 0;
    for (size_t b = 0; b < buckets_.getNumBuckets(); ++b) {
      total += buckets_.getByIndex(b).count(level);
    }
    return total;
  }

  /* Total count of values added during the given interval (all buckets). */
  uint64_t count(TimePoint start, TimePoint end) const {
    uint64_t total = 0;
    for (size_t b = 0; b < buckets_.getNumBuckets(); ++b) {
      total += buckets_.getByIndex(b).count(start, end);
    }
    return total;
  }

  /* Total sum of values at the given timeseries level (all buckets). */
  ValueType sum(size_t level) const {
    ValueType total = ValueType();
    for (size_t b = 0; b < buckets_.getNumBuckets(); ++b) {
      total += buckets_.getByIndex(b).sum(level);
    }
    return total;
  }

  /* Total sum of values added during the given interval (all buckets). */
  ValueType sum(TimePoint start, TimePoint end) const {
    ValueType total = ValueType();
    for (size_t b = 0; b < buckets_.getNumBuckets(); ++b) {
      total += buckets_.getByIndex(b).sum(start, end);
    }
    return total;
  }

  /* Average of values at the given timeseries level (all buckets). */
  template <typename ReturnType = double>
  ReturnType avg(size_t level) const {
    auto total = ValueType();
    uint64_t nsamples = 0;
    computeAvgData(&total, &nsamples, level);
    return folly::detail::avgHelper<ReturnType>(total, nsamples);
  }

  /* Average of values added during the given interval (all buckets). */
  template <typename ReturnType = double>
  ReturnType avg(TimePoint start, TimePoint end) const {
    auto total = ValueType();
    uint64_t nsamples = 0;
    computeAvgData(&total, &nsamples, start, end);
    return folly::detail::avgHelper<ReturnType>(total, nsamples);
  }

  /*
   * Rate at the given timeseries level (all buckets).
   * This is the sum of all values divided by the time interval (in seconds).
   */
  template <typename ReturnType = double>
  ReturnType rate(size_t level) const {
    auto total = ValueType();
    Duration elapsed(0);
    computeRateData(&total, &elapsed, level);
    return folly::detail::rateHelper<ReturnType, Duration, Duration>(
        total, elapsed);
  }

  /*
   * Rate for the given interval (all buckets).
   * This is the sum of all values divided by the time interval (in seconds).
   */
  template <typename ReturnType = double>
  ReturnType rate(TimePoint start, TimePoint end) const {
    auto total = ValueType();
    Duration elapsed(0);
    computeRateData(&total, &elapsed, start, end);
    return folly::detail::rateHelper<ReturnType, Duration, Duration>(
        total, elapsed);
  }

  /*
   * Update every underlying timeseries object with the given timestamp. You
   * must call this directly before querying to ensure that the data in all
   * buckets is decayed properly.
   */
  void update(TimePoint now);

  /* clear all the data from the histogram. */
  void clear();

  /* Add a value into the histogram with timestamp 'now' */
  void addValue(TimePoint now, const ValueType& value);
  /* Add a value the given number of times with timestamp 'now' */
  void addValue(TimePoint now, const ValueType& value, uint64_t times);

  /*
   * Add all of the values from the specified histogram.
   *
   * All of the values will be added to the current time-slot.
   *
   * One use of this is for thread-local caching of frequently updated
   * histogram data.  For example, each thread can store a thread-local
   * Histogram that is updated frequently, and only add it to the global
   * TimeseriesHistogram once a second.
   */
  void addValues(TimePoint now, const folly::Histogram<ValueType>& values);

  /*
   * Return an estimate of the value at the given percentile in the histogram
   * in the given timeseries level.  The percentile is estimated as follows:
   *
   * - We retrieve a count of the values in each bucket (at the given level)
   * - We determine via the counts which bucket the given percentile falls in.
   * - We assume the average value in the bucket is also its median
   * - We then linearly interpolate within the bucket, by assuming that the
   *   distribution is uniform in the two value ranges [left, median) and
   *   [median, right) where [left, right) is the bucket value range.
   *
   * Caveats:
   * - If the histogram is empty, this always returns ValueType(), usually 0.
   * - For the 'under' and 'over' special buckets, their range is unbounded
   *   on one side.  In order for the interpolation to work, we assume that
   *   the average value in the bucket is equidistant from the two edges of
   *   the bucket.  In other words, we assume that the distance between the
   *   average and the known bound is equal to the distance between the average
   *   and the unknown bound.
   */
  ValueType getPercentileEstimate(double pct, size_t level) const;
  /*
   * Return an estimate of the value at the given percentile in the histogram
   * in the given historical interval.  Please see the documentation for
   * getPercentileEstimate(double pct, size_t level) for the explanation of the
   * estimation algorithm.
   */
  ValueType getPercentileEstimate(double pct, TimePoint start, TimePoint end)
      const;

  /*
   * Return the bucket index that the given percentile falls into (in the
   * given timeseries level).  This index can then be used to retrieve either
   * the bucket threshold, or other data from inside the bucket.
   */
  size_t getPercentileBucketIdx(double pct, size_t level) const;
  /*
   * Return the bucket index that the given percentile falls into (in the
   * given historical interval).  This index can then be used to retrieve either
   * the bucket threshold, or other data from inside the bucket.
   */
  size_t getPercentileBucketIdx(double pct, TimePoint start, TimePoint end)
      const;

  /* Get the bucket threshold for the bucket containing the given pct. */
  ValueType getPercentileBucketMin(double pct, size_t level) const {
    return getBucketMin(getPercentileBucketIdx(pct, level));
  }
  /* Get the bucket threshold for the bucket containing the given pct. */
  ValueType getPercentileBucketMin(double pct, TimePoint start, TimePoint end)
      const {
    return getBucketMin(getPercentileBucketIdx(pct, start, end));
  }

  /*
   * Print out serialized data from all buckets at the given level.
   * Format is: BUCKET [',' BUCKET ...]
   * Where: BUCKET == bucketMin ':' count ':' avg
   */
  std::string getString(size_t level) const;

  /*
   * Print out serialized data for all buckets in the historical interval.
   * For format, please see getString(size_t level).
   */
  std::string getString(TimePoint start, TimePoint end) const;

  /*
   * Legacy APIs that accept a Duration parameters rather than TimePoint.
   *
   * These treat the Duration as relative to the clock epoch.
   * Prefer using the correct TimePoint-based APIs instead.  These APIs will
   * eventually be deprecated and removed.
   */
  void update(Duration now) {
    update(TimePoint(now));
  }
  void addValue(Duration now, const ValueType& value) {
    addValue(TimePoint(now), value);
  }
  void addValue(Duration now, const ValueType& value, uint64_t times) {
    addValue(TimePoint(now), value, times);
  }
  void addValues(Duration now, const folly::Histogram<ValueType>& values) {
    addValues(TimePoint(now), values);
  }

 private:
  typedef ContainerType Bucket;
  struct CountFromLevel {
    explicit CountFromLevel(size_t level) : level_(level) {}

    uint64_t operator()(const ContainerType& bucket) const {
      return bucket.count(level_);
    }

   private:
    size_t level_;
  };
  struct CountFromInterval {
    explicit CountFromInterval(TimePoint start, TimePoint end)
        : start_(start), end_(end) {}

    uint64_t operator()(const ContainerType& bucket) const {
      return bucket.count(start_, end_);
    }

   private:
    TimePoint start_;
    TimePoint end_;
  };

  struct AvgFromLevel {
    explicit AvgFromLevel(size_t level) : level_(level) {}

    ValueType operator()(const ContainerType& bucket) const {
      return bucket.template avg<ValueType>(level_);
    }

   private:
    size_t level_;
  };

  template <typename ReturnType>
  struct AvgFromInterval {
    explicit AvgFromInterval(TimePoint start, TimePoint end)
        : start_(start), end_(end) {}

    ReturnType operator()(const ContainerType& bucket) const {
      return bucket.template avg<ReturnType>(start_, end_);
    }

   private:
    TimePoint start_;
    TimePoint end_;
  };

  /*
   * Special logic for the case of only one unique value registered
   * (this can happen when clients don't pick good bucket ranges or have
   * other bugs).  It's a lot easier for clients to track down these issues
   * if they are getting the correct value.
   */
  void maybeHandleSingleUniqueValue(const ValueType& value);

  void computeAvgData(ValueType* total, uint64_t* nsamples, size_t level) const;
  void computeAvgData(
      ValueType* total,
      uint64_t* nsamples,
      TimePoint start,
      TimePoint end) const;
  void computeRateData(ValueType* total, Duration* elapsed, size_t level) const;
  void computeRateData(
      ValueType* total,
      Duration* elapsed,
      TimePoint start,
      TimePoint end) const;

  folly::detail::HistogramBuckets<ValueType, ContainerType> buckets_;
  bool haveNotSeenValue_;
  bool singleUniqueValue_;
  ValueType firstValue_;
};
} // namespace folly
