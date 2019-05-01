/*
 * Copyright 2011-present Facebook, Inc.
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

#include <folly/stats/Histogram.h>

#include <folly/portability/GTest.h>
#include <folly/stats/Histogram-defs.h>

using folly::Histogram;

// Insert 100 evenly distributed values into a histogram with 100 buckets
TEST(Histogram, Test100) {
  Histogram<int64_t> h(1, 0, 100);

  for (unsigned int n = 0; n < 100; ++n) {
    h.addValue(n);
  }

  // 100 buckets, plus 1 for below min, and 1 for above max
  EXPECT_EQ(h.getNumBuckets(), 102);

  double epsilon = 1e-6;
  for (unsigned int n = 0; n <= 100; ++n) {
    double pct = n / 100.0;

    // Floating point arithmetic isn't 100% accurate, and if we just divide
    // (n / 100) the value should be exactly on a bucket boundary.  Add espilon
    // to ensure we fall in the upper bucket.
    if (n < 100) {
      double lowPct = -1.0;
      double highPct = -1.0;
      unsigned int bucketIdx =
          h.getPercentileBucketIdx(pct + epsilon, &lowPct, &highPct);
      EXPECT_EQ(n + 1, bucketIdx);
      EXPECT_FLOAT_EQ(n / 100.0, lowPct);
      EXPECT_FLOAT_EQ((n + 1) / 100.0, highPct);
    }

    // Also test n - epsilon, to test falling in the lower bucket.
    if (n > 0) {
      double lowPct = -1.0;
      double highPct = -1.0;
      unsigned int bucketIdx =
          h.getPercentileBucketIdx(pct - epsilon, &lowPct, &highPct);
      EXPECT_EQ(n, bucketIdx);
      EXPECT_FLOAT_EQ((n - 1) / 100.0, lowPct);
      EXPECT_FLOAT_EQ(n / 100.0, highPct);
    }

    // Check getPercentileEstimate()
    EXPECT_EQ(n, h.getPercentileEstimate(pct));
  }
}

// Test calling getPercentileBucketIdx() and getPercentileEstimate() on an
// empty histogram
TEST(Histogram, TestEmpty) {
  Histogram<int64_t> h(1, 0, 100);

  for (unsigned int n = 0; n <= 100; ++n) {
    double pct = n / 100.0;

    double lowPct = -1.0;
    double highPct = -1.0;
    unsigned int bucketIdx = h.getPercentileBucketIdx(pct, &lowPct, &highPct);
    EXPECT_EQ(1, bucketIdx);
    EXPECT_FLOAT_EQ(0.0, lowPct);
    EXPECT_FLOAT_EQ(0.0, highPct);

    EXPECT_EQ(0, h.getPercentileEstimate(pct));
  }
}

// Test calling getPercentileBucketIdx() and getPercentileEstimate() on a
// histogram with just a single value.
TEST(Histogram, Test1) {
  Histogram<int64_t> h(1, 0, 100);
  h.addValue(42);

  for (unsigned int n = 0; n < 100; ++n) {
    double pct = n / 100.0;

    double lowPct = -1.0;
    double highPct = -1.0;
    unsigned int bucketIdx = h.getPercentileBucketIdx(pct, &lowPct, &highPct);
    EXPECT_EQ(43, bucketIdx);
    EXPECT_FLOAT_EQ(0.0, lowPct);
    EXPECT_FLOAT_EQ(1.0, highPct);

    EXPECT_EQ(42, h.getPercentileEstimate(pct));
  }
}

// Test adding enough numbers to make the sum value overflow in the
// "below min" bucket
TEST(Histogram, TestOverflowMin) {
  Histogram<int64_t> h(1, 0, 100);

  for (unsigned int n = 0; n < 9; ++n) {
    h.addValue(-0x0fffffffffffffff);
  }

  // Compute a percentile estimate.  We only added values to the "below min"
  // bucket, so this should check that bucket.  We're mainly verifying that the
  // code doesn't crash here when the bucket average is larger than the max
  // value that is supposed to be in the bucket.
  int64_t estimate = h.getPercentileEstimate(0.05);
  // The code will return the smallest possible value when it detects an
  // overflow beyond the minimum value.
  EXPECT_EQ(std::numeric_limits<int64_t>::min(), estimate);
}

// Test adding enough numbers to make the sum value overflow in the
// "above max" bucket
TEST(Histogram, TestOverflowMax) {
  Histogram<int64_t> h(1, 0, 100);

  for (unsigned int n = 0; n < 9; ++n) {
    h.addValue(0x0fffffffffffffff);
  }

  // The code will return the maximum possible value when it detects an
  // overflow beyond the max value.
  int64_t estimate = h.getPercentileEstimate(0.95);
  EXPECT_EQ(std::numeric_limits<int64_t>::max(), estimate);
}

// Test adding enough numbers to make the sum value overflow in one of the
// normal buckets
TEST(Histogram, TestOverflowBucket) {
  Histogram<int64_t> h(0x0100000000000000, 0, 0x1000000000000000);

  for (unsigned int n = 0; n < 9; ++n) {
    h.addValue(0x0fffffffffffffff);
  }

  // The histogram code should return the bucket midpoint
  // when it detects overflow.
  int64_t estimate = h.getPercentileEstimate(0.95);
  EXPECT_EQ(0x0f80000000000000, estimate);
}

TEST(Histogram, TestDouble) {
  // Insert 100 evenly spaced values into a histogram
  Histogram<double> h(100.0, 0.0, 5000.0);
  for (double n = 50; n < 5000; n += 100) {
    h.addValue(n);
  }
  EXPECT_EQ(52, h.getNumBuckets());
  EXPECT_EQ(2500.0, h.getPercentileEstimate(0.5));
  EXPECT_EQ(4500.0, h.getPercentileEstimate(0.9));
}

// Test where the bucket width is not an even multiple of the histogram range
TEST(Histogram, TestDoubleInexactWidth) {
  Histogram<double> h(100.0, 0.0, 4970.0);
  for (double n = 50; n < 5000; n += 100) {
    h.addValue(n);
  }
  EXPECT_EQ(52, h.getNumBuckets());
  EXPECT_EQ(2500.0, h.getPercentileEstimate(0.5));
  EXPECT_EQ(4500.0, h.getPercentileEstimate(0.9));

  EXPECT_EQ(0, h.getBucketByIndex(51).count);
  h.addValue(4990);
  h.addValue(5100);
  EXPECT_EQ(2, h.getBucketByIndex(51).count);
  EXPECT_EQ(2600.0, h.getPercentileEstimate(0.5));
}

// Test where the bucket width is larger than the histogram range
// (There isn't really much point to defining a histogram this way,
// but we want to ensure that it still works just in case.)
TEST(Histogram, TestDoubleWidthTooBig) {
  Histogram<double> h(100.0, 0.0, 7.0);
  EXPECT_EQ(3, h.getNumBuckets());

  for (double n = 0; n < 7; n += 1) {
    h.addValue(n);
  }
  EXPECT_EQ(0, h.getBucketByIndex(0).count);
  EXPECT_EQ(7, h.getBucketByIndex(1).count);
  EXPECT_EQ(0, h.getBucketByIndex(2).count);
  EXPECT_EQ(3.0, h.getPercentileEstimate(0.5));

  h.addValue(-1.0);
  EXPECT_EQ(1, h.getBucketByIndex(0).count);
  h.addValue(7.5);
  EXPECT_EQ(1, h.getBucketByIndex(2).count);
  EXPECT_NEAR(3.0, h.getPercentileEstimate(0.5), 1e-14);
}

// Test that we get counts right
TEST(Histogram, Counts) {
  Histogram<int32_t> h(1, 0, 10);
  EXPECT_EQ(12, h.getNumBuckets());
  EXPECT_EQ(0, h.computeTotalCount());

  // Add one to each bucket, make sure the counts match
  for (int32_t i = 0; i < 10; i++) {
    h.addValue(i);
    EXPECT_EQ(i + 1, h.computeTotalCount());
  }

  // Add a lot to one bucket, make sure the counts still make sense
  for (int32_t i = 0; i < 100; i++) {
    h.addValue(0);
  }
  EXPECT_EQ(110, h.computeTotalCount());
}
