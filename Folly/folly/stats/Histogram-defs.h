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
#include <folly/stats/Histogram.h>

#include <glog/logging.h>

namespace folly {

namespace detail {

template <typename T, typename BucketT>
HistogramBuckets<T, BucketT>::HistogramBuckets(
    ValueType bucketSize,
    ValueType min,
    ValueType max,
    const BucketType& defaultBucket)
    : bucketSize_(bucketSize), min_(min), max_(max) {
  CHECK_GT(bucketSize_, ValueType(0));
  CHECK_LT(min_, max_);

  // Deliberately make this a signed type, because we're about
  // to compare it against max-min, which is nominally signed, too.
  int64_t numBuckets = int64_t((max - min) / bucketSize);
  // Round up if the bucket size does not fit evenly
  if (numBuckets * bucketSize < max - min) {
    ++numBuckets;
  }
  // Add 2 for the extra 'below min' and 'above max' buckets
  numBuckets += 2;
  buckets_.assign(size_t(numBuckets), defaultBucket);
}

template <typename T, typename BucketType>
size_t HistogramBuckets<T, BucketType>::getBucketIdx(ValueType value) const {
  if (value < min_) {
    return 0;
  } else if (value >= max_) {
    return buckets_.size() - 1;
  } else {
    // the 1 is the below_min bucket
    return size_t(((value - min_) / bucketSize_) + 1);
  }
}

template <typename T, typename BucketType>
template <typename CountFn>
uint64_t HistogramBuckets<T, BucketType>::computeTotalCount(
    CountFn countFromBucket) const {
  uint64_t count = 0;
  for (size_t n = 0; n < buckets_.size(); ++n) {
    count += countFromBucket(const_cast<const BucketType&>(buckets_[n]));
  }
  return count;
}

template <typename T, typename BucketType>
template <typename CountFn>
size_t HistogramBuckets<T, BucketType>::getPercentileBucketIdx(
    double pct,
    CountFn countFromBucket,
    double* lowPct,
    double* highPct) const {
  CHECK_GE(pct, 0.0);
  CHECK_LE(pct, 1.0);

  auto numBuckets = buckets_.size();

  // Compute the counts in each bucket
  std::vector<uint64_t> counts(numBuckets);
  uint64_t totalCount = 0;
  for (size_t n = 0; n < numBuckets; ++n) {
    uint64_t bucketCount =
        countFromBucket(const_cast<const BucketType&>(buckets_[n]));
    counts[n] = bucketCount;
    totalCount += bucketCount;
  }

  // If there are no elements, just return the lowest bucket.
  // Note that we return bucket 1, which is the first bucket in the
  // histogram range; bucket 0 is for all values below min_.
  if (totalCount == 0) {
    // Set lowPct and highPct both to 0.
    // getPercentileEstimate() will recognize this to mean that the histogram
    // is empty.
    if (lowPct) {
      *lowPct = 0.0;
    }
    if (highPct) {
      *highPct = 0.0;
    }
    return 1;
  }

  // Loop through all the buckets, keeping track of each bucket's
  // percentile range: [0,10], [10,17], [17,45], etc.  When we find a range
  // that includes our desired percentile, we return that bucket index.
  double prevPct = 0.0;
  double curPct = 0.0;
  uint64_t curCount = 0;
  size_t idx;
  for (idx = 0; idx < numBuckets; ++idx) {
    if (counts[idx] == 0) {
      // skip empty buckets
      continue;
    }

    prevPct = curPct;
    curCount += counts[idx];
    curPct = static_cast<double>(curCount) / totalCount;
    if (pct <= curPct) {
      // This is the desired bucket
      break;
    }
  }

  if (lowPct) {
    *lowPct = prevPct;
  }
  if (highPct) {
    *highPct = curPct;
  }
  return idx;
}

template <typename T, typename BucketType>
template <typename CountFn, typename AvgFn>
T HistogramBuckets<T, BucketType>::getPercentileEstimate(
    double pct,
    CountFn countFromBucket,
    AvgFn avgFromBucket) const {
  // Find the bucket where this percentile falls
  double lowPct;
  double highPct;
  size_t bucketIdx =
      getPercentileBucketIdx(pct, countFromBucket, &lowPct, &highPct);
  if (lowPct == 0.0 && highPct == 0.0) {
    // Invalid range -- the buckets must all be empty
    // Return the default value for ValueType.
    return ValueType();
  }
  if (lowPct == highPct) {
    // Unlikely to have exact equality,
    // but just return the bucket average in this case.
    // We handle this here to avoid division by 0 below.
    return avgFromBucket(buckets_[bucketIdx]);
  }

  CHECK_GE(pct, lowPct);
  CHECK_LE(pct, highPct);
  CHECK_LT(lowPct, highPct);

  // Compute information about this bucket
  ValueType avg = avgFromBucket(buckets_[bucketIdx]);
  ValueType low;
  ValueType high;
  if (bucketIdx == 0) {
    if (avg > min_) {
      // This normally shouldn't happen.  This bucket is only supposed to track
      // values less than min_.  Most likely this means that integer overflow
      // occurred, and the code in avgFromBucket() returned a huge value
      // instead of a small one.  Just return the minimum possible value for
      // now.
      //
      // (Note that if the counter keeps being decremented, eventually it will
      // wrap and become small enough that we won't detect this any more, and
      // we will return bogus information.)
      LOG(ERROR) << "invalid average value in histogram minimum bucket: " << avg
                 << " > " << min_ << ": possible integer overflow?";
      return getBucketMin(bucketIdx);
    }
    // For the below-min bucket, just assume the lowest value ever seen is
    // twice as far away from min_ as avg.
    high = min_;
    low = high - (2 * (high - avg));
    // Adjust low in case it wrapped
    if (low > avg) {
      low = std::numeric_limits<ValueType>::min();
    }
  } else if (bucketIdx == buckets_.size() - 1) {
    if (avg < max_) {
      // Most likely this means integer overflow occurred.  See the comments
      // above in the minimum case.
      LOG(ERROR) << "invalid average value in histogram maximum bucket: " << avg
                 << " < " << max_ << ": possible integer overflow?";
      return getBucketMax(bucketIdx);
    }
    // Similarly for the above-max bucket, assume the highest value ever seen
    // is twice as far away from max_ as avg.
    low = max_;
    high = low + (2 * (avg - low));
    // Adjust high in case it wrapped
    if (high < avg) {
      high = std::numeric_limits<ValueType>::max();
    }
  } else {
    low = getBucketMin(bucketIdx);
    high = getBucketMax(bucketIdx);
    if (avg < low || avg > high) {
      // Most likely this means an integer overflow occurred.
      // See the comments above.  Return the midpoint between low and high
      // as a best guess, since avg is meaningless.
      LOG(ERROR) << "invalid average value in histogram bucket: " << avg
                 << " not in range [" << low << ", " << high
                 << "]: possible integer overflow?";
      return (low + high) / 2;
    }
  }

  // Since we know the average value in this bucket, we can do slightly better
  // than just assuming the data points in this bucket are uniformly
  // distributed between low and high.
  //
  // Assume that the median value in this bucket is the same as the average
  // value.
  double medianPct = (lowPct + highPct) / 2.0;
  if (pct < medianPct) {
    // Assume that the data points lower than the median of this bucket
    // are uniformly distributed between low and avg
    double pctThroughSection = (pct - lowPct) / (medianPct - lowPct);
    return T(low + ((avg - low) * pctThroughSection));
  } else {
    // Assume that the data points greater than the median of this bucket
    // are uniformly distributed between avg and high
    double pctThroughSection = (pct - medianPct) / (highPct - medianPct);
    return T(avg + ((high - avg) * pctThroughSection));
  }
}

} // namespace detail

template <typename T>
std::string Histogram<T>::debugString() const {
  std::string ret = folly::to<std::string>(
      "num buckets: ",
      buckets_.getNumBuckets(),
      ", bucketSize: ",
      buckets_.getBucketSize(),
      ", min: ",
      buckets_.getMin(),
      ", max: ",
      buckets_.getMax(),
      "\n");

  for (size_t i = 0; i < buckets_.getNumBuckets(); ++i) {
    folly::toAppend(
        "  ",
        buckets_.getBucketMin(i),
        ": ",
        buckets_.getByIndex(i).count,
        "\n",
        &ret);
  }

  return ret;
}

template <typename T>
void Histogram<T>::toTSV(std::ostream& out, bool skipEmptyBuckets) const {
  for (size_t i = 0; i < buckets_.getNumBuckets(); ++i) {
    // Do not output empty buckets in order to reduce data file size.
    if (skipEmptyBuckets && getBucketByIndex(i).count == 0) {
      continue;
    }
    const auto& bucket = getBucketByIndex(i);
    out << getBucketMin(i) << '\t' << getBucketMax(i) << '\t' << bucket.count
        << '\t' << bucket.sum << '\n';
  }
}

} // namespace folly
