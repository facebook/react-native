/*
 * Copyright 2015-present Facebook, Inc.
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

#include <folly/test/TokenBucketTest.h>

#include <folly/portability/GTest.h>

using namespace folly;

TEST(TokenBucket, ReverseTime) {
  const double rate = 1000;
  TokenBucket tokenBucket(rate, rate * 0.01 + 1e-6, 0);
  size_t count = 0;
  while (tokenBucket.consume(1, 0.1)) {
    count += 1;
  }
  EXPECT_EQ(10, count);
  // Going backwards in time has no affect on the toke count (this protects
  // against different threads providing out of order timestamps).
  double tokensBefore = tokenBucket.available();
  EXPECT_FALSE(tokenBucket.consume(1, 0.09999999));
  EXPECT_EQ(tokensBefore, tokenBucket.available());
}

TEST_P(TokenBucketTest, sanity) {
  std::pair<double, double> params = GetParam();
  double rate = params.first;
  double consumeSize = params.second;

  const double tenMillisecondBurst = rate * 0.010;
  // Select a burst size of 10 milliseconds at the max rate or the consume size
  // if 10 ms at rate is too small.
  const double burstSize = std::max(consumeSize, tenMillisecondBurst);
  TokenBucket tokenBucket(rate, burstSize, 0);
  double tokenCounter = 0;
  double currentTime = 0;
  // Simulate time advancing 10 seconds
  for (; currentTime <= 10.0; currentTime += 0.001) {
    EXPECT_FALSE(tokenBucket.consume(burstSize + 1, currentTime));
    while (tokenBucket.consume(consumeSize, currentTime)) {
      tokenCounter += consumeSize;
    }
    // Tokens consumed should exceed some lower bound based on rate.
    // Note: The token bucket implementation is not precise, so the lower bound
    // is somewhat fudged. The upper bound is accurate however.
    EXPECT_LE(rate * currentTime * 0.9 - 1, tokenCounter);
    // Tokens consumed should not exceed some upper bound based on rate.
    EXPECT_GE(rate * currentTime + 1e-6, tokenCounter);
  }
}

static std::vector<std::pair<double, double>> rateToConsumeSize = {
    {100, 1},
    {1000, 1},
    {10000, 1},
    {10000, 5},
};

INSTANTIATE_TEST_CASE_P(
    TokenBucket,
    TokenBucketTest,
    ::testing::ValuesIn(rateToConsumeSize));

void doTokenBucketTest(double maxQps, double consumeSize) {
  const double tenMillisecondBurst = maxQps * 0.010;
  // Select a burst size of 10 milliseconds at the max rate or the consume size
  // if 10 ms at maxQps is too small.
  const double burstSize = std::max(consumeSize, tenMillisecondBurst);
  TokenBucket tokenBucket(maxQps, burstSize, 0);
  double tokenCounter = 0;
  double currentTime = 0;
  // Simulate time advancing 10 seconds
  for (; currentTime <= 10.0; currentTime += 0.001) {
    EXPECT_FALSE(tokenBucket.consume(burstSize + 1, currentTime));
    while (tokenBucket.consume(consumeSize, currentTime)) {
      tokenCounter += consumeSize;
    }
    // Tokens consumed should exceed some lower bound based on maxQps.
    // Note: The token bucket implementation is not precise, so the lower bound
    // is somewhat fudged. The upper bound is accurate however.
    EXPECT_LE(maxQps * currentTime * 0.9 - 1, tokenCounter);
    // Tokens consumed should not exceed some upper bound based on maxQps.
    EXPECT_GE(maxQps * currentTime + 1e-6, tokenCounter);
  }
}

TEST(TokenBucket, sanity) {
  doTokenBucketTest(100, 1);
  doTokenBucketTest(1000, 1);
  doTokenBucketTest(10000, 1);
  // Consume more than one at a time.
  doTokenBucketTest(10000, 5);
}

TEST(TokenBucket, ReverseTime2) {
  const double rate = 1000;
  TokenBucket tokenBucket(rate, rate * 0.01 + 1e-6);
  size_t count = 0;
  while (tokenBucket.consume(1, 0.1)) {
    count += 1;
  }
  EXPECT_EQ(10, count);
  // Going backwards in time has no affect on the toke count (this protects
  // against different threads providing out of order timestamps).
  double tokensBefore = tokenBucket.available();
  EXPECT_FALSE(tokenBucket.consume(1, 0.09999999));
  EXPECT_EQ(tokensBefore, tokenBucket.available());
}

TEST(TokenBucket, drainOnFail) {
  DynamicTokenBucket tokenBucket;

  // Almost empty the bucket
  EXPECT_TRUE(tokenBucket.consume(9, 10, 10, 1));

  // Request more tokens than available
  EXPECT_FALSE(tokenBucket.consume(5, 10, 10, 1));
  EXPECT_DOUBLE_EQ(1.0, tokenBucket.available(10, 10, 1));

  // Again request more tokens than available, but ask to drain
  EXPECT_DOUBLE_EQ(1.0, tokenBucket.consumeOrDrain(5, 10, 10, 1));
  EXPECT_DOUBLE_EQ(0.0, tokenBucket.consumeOrDrain(1, 10, 10, 1));
}
