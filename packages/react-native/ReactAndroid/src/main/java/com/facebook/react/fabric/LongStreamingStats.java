/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import java.util.Comparator;
import java.util.PriorityQueue;
import java.util.Queue;

/* package */
class LongStreamingStats {
  // TODO(T138627466): Calculate median value with better algorithm after Android API 24.
  private final Queue<Long> minHeap =
      new PriorityQueue<>(11, Comparator.comparingLong(aLong -> aLong));
  private final Queue<Long> maxHeap =
      new PriorityQueue<>(
          11,
          (first, second) -> {
            // Reversed order
            return Long.compare(second, first);
          });
  private double streamingAverage = 0.0;
  private int len = 0;
  private long max = 0;

  LongStreamingStats() {}

  public void add(long n) {
    // To make medians more useful, we discard all zero values
    // This isn't perfect and certainly makes this a totally invalid median, but, alas...
    if (n != 0) {
      if (minHeap.size() == maxHeap.size()) {
        maxHeap.offer(n);
        minHeap.offer(maxHeap.poll());
      } else {
        minHeap.offer(n);
        maxHeap.offer(minHeap.poll());
      }
    }

    len++;
    if (len == 1) {
      streamingAverage = n;
    } else {
      streamingAverage = (streamingAverage / (len / (len - 1))) + (n / len);
    }

    max = (n > max ? n : max);
  }

  public double getMedian() {
    if (minHeap.size() == 0 && maxHeap.size() == 0) {
      return 0;
    }

    long median;
    if (minHeap.size() > maxHeap.size()) {
      median = minHeap.peek();
    } else {
      median = (minHeap.peek() + maxHeap.peek()) / 2;
    }
    return median;
  }

  public double getAverage() {
    return streamingAverage;
  }

  public long getMax() {
    return max;
  }
}
