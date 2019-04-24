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

#include <folly/Conv.h>
#include <folly/stats/BucketedTimeSeries-defs.h>
#include <folly/stats/Histogram-defs.h>
#include <folly/stats/MultiLevelTimeSeries-defs.h>
#include <folly/stats/TimeseriesHistogram.h>

namespace folly {

template <typename T, typename CT, typename C>
TimeseriesHistogram<T, CT, C>::TimeseriesHistogram(
    ValueType bucketSize,
    ValueType min,
    ValueType max,
    const ContainerType& copyMe)
    : buckets_(bucketSize, min, max, copyMe),
      haveNotSeenValue_(true),
      singleUniqueValue_(false) {}

template <typename T, typename CT, typename C>
void TimeseriesHistogram<T, CT, C>::addValue(
    TimePoint now,
    const ValueType& value) {
  buckets_.getByValue(value).addValue(now, value);
  maybeHandleSingleUniqueValue(value);
}

template <typename T, typename CT, typename C>
void TimeseriesHistogram<T, CT, C>::addValue(
    TimePoint now,
    const ValueType& value,
    uint64_t times) {
  buckets_.getByValue(value).addValue(now, value, times);
  maybeHandleSingleUniqueValue(value);
}

template <typename T, typename CT, typename C>
void TimeseriesHistogram<T, CT, C>::addValues(
    TimePoint now,
    const folly::Histogram<ValueType>& hist) {
  CHECK_EQ(hist.getMin(), getMin());
  CHECK_EQ(hist.getMax(), getMax());
  CHECK_EQ(hist.getBucketSize(), getBucketSize());
  CHECK_EQ(hist.getNumBuckets(), getNumBuckets());

  for (size_t n = 0; n < hist.getNumBuckets(); ++n) {
    const typename folly::Histogram<ValueType>::Bucket& histBucket =
        hist.getBucketByIndex(n);
    Bucket& myBucket = buckets_.getByIndex(n);
    myBucket.addValueAggregated(now, histBucket.sum, histBucket.count);
  }

  // We don't bother with the singleUniqueValue_ tracking.
  haveNotSeenValue_ = false;
  singleUniqueValue_ = false;
}

template <typename T, typename CT, typename C>
void TimeseriesHistogram<T, CT, C>::maybeHandleSingleUniqueValue(
    const ValueType& value) {
  if (haveNotSeenValue_) {
    firstValue_ = value;
    singleUniqueValue_ = true;
    haveNotSeenValue_ = false;
  } else if (singleUniqueValue_) {
    if (value != firstValue_) {
      singleUniqueValue_ = false;
    }
  }
}

template <typename T, typename CT, typename C>
T TimeseriesHistogram<T, CT, C>::getPercentileEstimate(double pct, size_t level)
    const {
  if (singleUniqueValue_) {
    return firstValue_;
  }

  return buckets_.getPercentileEstimate(
      pct / 100.0, CountFromLevel(level), AvgFromLevel(level));
}

template <typename T, typename CT, typename C>
T TimeseriesHistogram<T, CT, C>::getPercentileEstimate(
    double pct,
    TimePoint start,
    TimePoint end) const {
  if (singleUniqueValue_) {
    return firstValue_;
  }

  return buckets_.getPercentileEstimate(
      pct / 100.0,
      CountFromInterval(start, end),
      AvgFromInterval<T>(start, end));
}

template <typename T, typename CT, typename C>
size_t TimeseriesHistogram<T, CT, C>::getPercentileBucketIdx(
    double pct,
    size_t level) const {
  return buckets_.getPercentileBucketIdx(pct / 100.0, CountFromLevel(level));
}

template <typename T, typename CT, typename C>
size_t TimeseriesHistogram<T, CT, C>::getPercentileBucketIdx(
    double pct,
    TimePoint start,
    TimePoint end) const {
  return buckets_.getPercentileBucketIdx(
      pct / 100.0, CountFromInterval(start, end));
}

template <typename T, typename CT, typename C>
void TimeseriesHistogram<T, CT, C>::clear() {
  for (size_t i = 0; i < buckets_.getNumBuckets(); i++) {
    buckets_.getByIndex(i).clear();
  }
}

template <typename T, typename CT, typename C>
void TimeseriesHistogram<T, CT, C>::update(TimePoint now) {
  for (size_t i = 0; i < buckets_.getNumBuckets(); i++) {
    buckets_.getByIndex(i).update(now);
  }
}

template <typename T, typename CT, typename C>
std::string TimeseriesHistogram<T, CT, C>::getString(size_t level) const {
  std::string result;

  for (size_t i = 0; i < buckets_.getNumBuckets(); i++) {
    if (i > 0) {
      toAppend(",", &result);
    }
    const ContainerType& cont = buckets_.getByIndex(i);
    toAppend(
        buckets_.getBucketMin(i),
        ":",
        cont.count(level),
        ":",
        cont.template avg<ValueType>(level),
        &result);
  }

  return result;
}

template <typename T, typename CT, typename C>
std::string TimeseriesHistogram<T, CT, C>::getString(
    TimePoint start,
    TimePoint end) const {
  std::string result;

  for (size_t i = 0; i < buckets_.getNumBuckets(); i++) {
    if (i > 0) {
      toAppend(",", &result);
    }
    const ContainerType& cont = buckets_.getByIndex(i);
    toAppend(
        buckets_.getBucketMin(i),
        ":",
        cont.count(start, end),
        ":",
        cont.avg(start, end),
        &result);
  }

  return result;
}

template <class T, class CT, class C>
void TimeseriesHistogram<T, CT, C>::computeAvgData(
    ValueType* total,
    uint64_t* nsamples,
    size_t level) const {
  for (size_t b = 0; b < buckets_.getNumBuckets(); ++b) {
    const auto& levelObj = buckets_.getByIndex(b).getLevel(level);
    *total += levelObj.sum();
    *nsamples += levelObj.count();
  }
}

template <class T, class CT, class C>
void TimeseriesHistogram<T, CT, C>::computeAvgData(
    ValueType* total,
    uint64_t* nsamples,
    TimePoint start,
    TimePoint end) const {
  for (size_t b = 0; b < buckets_.getNumBuckets(); ++b) {
    const auto& levelObj = buckets_.getByIndex(b).getLevel(start);
    *total += levelObj.sum(start, end);
    *nsamples += levelObj.count(start, end);
  }
}

template <typename T, typename CT, typename C>
void TimeseriesHistogram<T, CT, C>::computeRateData(
    ValueType* total,
    Duration* elapsed,
    size_t level) const {
  for (size_t b = 0; b < buckets_.getNumBuckets(); ++b) {
    const auto& levelObj = buckets_.getByIndex(b).getLevel(level);
    *total += levelObj.sum();
    *elapsed = std::max(*elapsed, levelObj.elapsed());
  }
}

template <class T, class CT, class C>
void TimeseriesHistogram<T, CT, C>::computeRateData(
    ValueType* total,
    Duration* elapsed,
    TimePoint start,
    TimePoint end) const {
  for (size_t b = 0; b < buckets_.getNumBuckets(); ++b) {
    const auto& level = buckets_.getByIndex(b).getLevel(start);
    *total += level.sum(start, end);
    *elapsed = std::max(*elapsed, level.elapsed(start, end));
  }
}

} // namespace folly
