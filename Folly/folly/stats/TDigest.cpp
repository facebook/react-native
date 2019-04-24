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

#include <folly/stats/TDigest.h>
#include <folly/stats/detail/DoubleRadixSort.h>

#include <algorithm>
#include <limits>

namespace folly {

/*
 * A good biased scaling function has the following properties:
 *   - The value of the function k(0, delta) = 0, and k(1, delta) = delta.
 *     This is a requirement for any t-digest function.
 *   - The limit of the derivative of the function dk/dq at 0 is inf, and at
 *     1 is inf. This provides bias to improve accuracy at the tails.
 *   - For any q <= 0.5, dk/dq(q) = dk/dq(1-q). This ensures that the accuracy
 *     of upper and lower quantiles are equivalent.
 *
 * The scaling function used here is...
 *   k(q, d) = (IF q >= 0.5, d - d * sqrt(2 - 2q) / 2, d * sqrt(2q) / 2)
 *
 *   k(0, d) = 0
 *   k(1, d) = d
 *
 *   dk/dq = (IF q >= 0.5, d / sqrt(2-2q), d / sqrt(2q))
 *   limit q->1 dk/dq = inf
 *   limit q->0 dk/dq = inf
 *
 *   When plotted, the derivative function is symmetric, centered at q=0.5.
 *
 * Note that FMA has been tested here, but benchmarks have not shown it to be a
 * performance improvement.
 */

/*
 * q_to_k is unused but left here as a comment for completeness.
 * double q_to_k(double q, double d) {
 *   if (q >= 0.5) {
 *     return d - d * std::sqrt(0.5 - 0.5 * q);
 *   }
 *   return d * std::sqrt(0.5 * q);
 * }
 */

static double k_to_q(double k, double d) {
  double k_div_d = k / d;
  if (k_div_d >= 0.5) {
    double base = 1 - k_div_d;
    return 1 - 2 * base * base;
  } else {
    return 2 * k_div_d * k_div_d;
  }
}

static double clamp(double v, double lo, double hi) {
  if (v > hi) {
    return hi;
  } else if (v < lo) {
    return lo;
  }
  return v;
}

TDigest::TDigest(
    std::vector<Centroid> centroids,
    double sum,
    double count,
    double max_val,
    double min_val,
    size_t maxSize)
    : maxSize_(maxSize),
      sum_(sum),
      count_(count),
      max_(max_val),
      min_(min_val) {
  if (centroids.size() <= maxSize_) {
    centroids_ = std::move(centroids);
  } else {
    // Number of centroids is greater than maxSize, we need to compress them
    // When merging, resulting digest takes the maxSize of the first digest
    auto sz = centroids.size();
    std::array<TDigest, 2> digests{{
        TDigest(maxSize_),
        TDigest(std::move(centroids), sum_, count_, max_, min_, sz),
    }};
    *this = this->merge(digests);
  }
}

// Merge unsorted values by first sorting them.  Use radix sort if
// possible.  This implementation puts all additional memory in the
// heap, so that if called from fiber context we do not smash the
// stack.  Otherwise it is very similar to boost::spreadsort.
TDigest TDigest::merge(Range<const double*> unsortedValues) const {
  auto n = unsortedValues.size();

  // We require 256 buckets per byte level, plus one count array we can reuse.
  std::unique_ptr<uint64_t[]> buckets{new uint64_t[256 * 9]};
  // Allocate input and tmp array
  std::unique_ptr<double[]> tmp{new double[n * 2]};
  auto out = tmp.get() + n;
  auto in = tmp.get();
  std::copy(unsortedValues.begin(), unsortedValues.end(), in);

  detail::double_radix_sort(n, buckets.get(), in, out);
  DCHECK(std::is_sorted(in, in + n));

  return merge(presorted, Range<const double*>(in, in + n));
}

TDigest TDigest::merge(presorted_t, Range<const double*> sortedValues) const {
  if (sortedValues.empty()) {
    return *this;
  }

  TDigest result(maxSize_);

  result.count_ = count_ + sortedValues.size();

  double maybeMin = *sortedValues.begin();
  double maybeMax = *(sortedValues.end() - 1);
  if (count_ > 0) {
    // We know that min_ and max_ are numbers
    result.min_ = std::min(min_, maybeMin);
    result.max_ = std::max(max_, maybeMax);
  } else {
    // We know that min_ and max_ are NaN.
    result.min_ = maybeMin;
    result.max_ = maybeMax;
  }

  std::vector<Centroid> compressed;
  compressed.reserve(maxSize_);

  double k_limit = 1;
  double q_limit_times_count = k_to_q(k_limit++, maxSize_) * result.count_;

  auto it_centroids = centroids_.begin();
  auto it_sortedValues = sortedValues.begin();

  Centroid cur;
  if (it_centroids != centroids_.end() &&
      it_centroids->mean() < *it_sortedValues) {
    cur = *it_centroids++;
  } else {
    cur = Centroid(*it_sortedValues++, 1.0);
  }

  double weightSoFar = cur.weight();

  // Keep track of sums along the way to reduce expensive floating points
  double sumsToMerge = 0;
  double weightsToMerge = 0;

  while (it_centroids != centroids_.end() ||
         it_sortedValues != sortedValues.end()) {
    Centroid next;

    if (it_centroids != centroids_.end() &&
        (it_sortedValues == sortedValues.end() ||
         it_centroids->mean() < *it_sortedValues)) {
      next = *it_centroids++;
    } else {
      next = Centroid(*it_sortedValues++, 1.0);
    }

    double nextSum = next.mean() * next.weight();
    weightSoFar += next.weight();

    if (weightSoFar <= q_limit_times_count) {
      sumsToMerge += nextSum;
      weightsToMerge += next.weight();
    } else {
      result.sum_ += cur.add(sumsToMerge, weightsToMerge);
      sumsToMerge = 0;
      weightsToMerge = 0;
      compressed.push_back(cur);
      q_limit_times_count = k_to_q(k_limit++, maxSize_) * result.count_;
      cur = next;
    }
  }
  result.sum_ += cur.add(sumsToMerge, weightsToMerge);
  compressed.push_back(cur);
  compressed.shrink_to_fit();

  // Deal with floating point precision
  std::sort(compressed.begin(), compressed.end());

  result.centroids_ = std::move(compressed);
  return result;
}

TDigest TDigest::merge(Range<const TDigest*> digests) {
  size_t nCentroids = 0;
  for (auto it = digests.begin(); it != digests.end(); it++) {
    nCentroids += it->centroids_.size();
  }

  if (nCentroids == 0) {
    return TDigest();
  }

  std::vector<Centroid> centroids;
  centroids.reserve(nCentroids);

  std::vector<std::vector<Centroid>::iterator> starts;
  starts.reserve(digests.size());

  double count = 0;

  // We can safely use these limits to avoid isnan checks below because we know
  // nCentroids > 0, so at least one TDigest has a min and max.
  double min = std::numeric_limits<double>::infinity();
  double max = -std::numeric_limits<double>::infinity();

  for (auto it = digests.begin(); it != digests.end(); it++) {
    starts.push_back(centroids.end());
    double curCount = it->count();
    if (curCount > 0) {
      DCHECK(!std::isnan(it->min_));
      DCHECK(!std::isnan(it->max_));
      min = std::min(min, it->min_);
      max = std::max(max, it->max_);
      count += curCount;
      for (const auto& centroid : it->centroids_) {
        centroids.push_back(centroid);
      }
    }
  }

  for (size_t digestsPerBlock = 1; digestsPerBlock < starts.size();
       digestsPerBlock *= 2) {
    // Each sorted block is digestPerBlock digests big. For each step, try to
    // merge two blocks together.
    for (size_t i = 0; i < starts.size(); i += (digestsPerBlock * 2)) {
      // It is possible that this block is incomplete (less than digestsPerBlock
      // big). In that case, the rest of the block is sorted and leave it alone
      if (i + digestsPerBlock < starts.size()) {
        auto first = starts[i];
        auto middle = starts[i + digestsPerBlock];

        // It is possible that the next block is incomplete (less than
        // digestsPerBlock big). In that case, merge to end. Otherwise, merge to
        // the end of that block.
        std::vector<Centroid>::iterator last =
            (i + (digestsPerBlock * 2) < starts.size())
            ? *(starts.begin() + i + 2 * digestsPerBlock)
            : centroids.end();
        std::inplace_merge(first, middle, last);
      }
    }
  }

  DCHECK(std::is_sorted(centroids.begin(), centroids.end()));

  size_t maxSize = digests.begin()->maxSize_;
  TDigest result(maxSize);

  std::vector<Centroid> compressed;
  compressed.reserve(maxSize);

  double k_limit = 1;
  double q_limit_times_count = k_to_q(k_limit, maxSize) * count;

  Centroid cur = centroids.front();
  double weightSoFar = cur.weight();
  double sumsToMerge = 0;
  double weightsToMerge = 0;
  for (auto it = centroids.begin() + 1; it != centroids.end(); ++it) {
    weightSoFar += it->weight();
    if (weightSoFar <= q_limit_times_count) {
      sumsToMerge += it->mean() * it->weight();
      weightsToMerge += it->weight();
    } else {
      result.sum_ += cur.add(sumsToMerge, weightsToMerge);
      sumsToMerge = 0;
      weightsToMerge = 0;
      compressed.push_back(cur);
      q_limit_times_count = k_to_q(k_limit++, maxSize) * count;
      cur = *it;
    }
  }
  result.sum_ += cur.add(sumsToMerge, weightsToMerge);
  compressed.push_back(cur);
  compressed.shrink_to_fit();

  // Deal with floating point precision
  std::sort(compressed.begin(), compressed.end());

  result.count_ = count;
  result.min_ = min;
  result.max_ = max;
  result.centroids_ = std::move(compressed);
  return result;
}

double TDigest::estimateQuantile(double q) const {
  if (centroids_.empty()) {
    return 0.0;
  }
  double rank = q * count_;

  size_t pos;
  double t;
  if (q > 0.5) {
    if (q >= 1.0) {
      return max_;
    }
    pos = 0;
    t = count_;
    for (auto rit = centroids_.rbegin(); rit != centroids_.rend(); ++rit) {
      t -= rit->weight();
      if (rank >= t) {
        pos = std::distance(rit, centroids_.rend()) - 1;
        break;
      }
    }
  } else {
    if (q <= 0.0) {
      return min_;
    }
    pos = centroids_.size() - 1;
    t = 0;
    for (auto it = centroids_.begin(); it != centroids_.end(); ++it) {
      if (rank < t + it->weight()) {
        pos = std::distance(centroids_.begin(), it);
        break;
      }
      t += it->weight();
    }
  }

  double delta = 0;
  double min = min_;
  double max = max_;
  if (centroids_.size() > 1) {
    if (pos == 0) {
      delta = centroids_[pos + 1].mean() - centroids_[pos].mean();
      max = centroids_[pos + 1].mean();
    } else if (pos == centroids_.size() - 1) {
      delta = centroids_[pos].mean() - centroids_[pos - 1].mean();
      min = centroids_[pos - 1].mean();
    } else {
      delta = (centroids_[pos + 1].mean() - centroids_[pos - 1].mean()) / 2;
      min = centroids_[pos - 1].mean();
      max = centroids_[pos + 1].mean();
    }
  }
  auto value = centroids_[pos].mean() +
      ((rank - t) / centroids_[pos].weight() - 0.5) * delta;
  return clamp(value, min, max);
}

double TDigest::Centroid::add(double sum, double weight) {
  sum += (mean_ * weight_);
  weight_ += weight;
  mean_ = sum / weight_;
  return sum;
}

} // namespace folly
