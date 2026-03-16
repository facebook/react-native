/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>
#include <algorithm>
#include <vector>

namespace facebook::react {

/**
 * Computes the Longest Increasing Subsequence (LIS) of the given
 * sequence of values using O(n log n) patience sorting.
 *
 * Returns a vector<bool> of the same size as `values`, where
 * result[i] == true means values[i] is part of the LIS.
 *
 * Only elements where include[i] == true are considered;
 * elements with include[i] == false are ignored and will always
 * be false in the result.
 */
inline std::vector<bool> longestIncreasingSubsequence(
    const std::vector<size_t> &values,
    const std::vector<bool> &include)
{
  react_native_assert(values.size() == include.size());

  size_t n = values.size();
  std::vector<bool> inLIS(n, false);

  if (n == 0) {
    return inLIS;
  }

  // Collect indices of included elements.
  std::vector<size_t> indices;
  indices.reserve(n);
  for (size_t i = 0; i < n; i++) {
    if (include[i]) {
      indices.push_back(i);
    }
  }

  if (indices.empty()) {
    return inLIS;
  }

  // tails[i] = smallest tail value of all increasing subsequences
  // of length i+1.
  std::vector<size_t> tails;
  // tailIndices[i] = index into `indices` whose value is tails[i].
  std::vector<size_t> tailIndices;
  // predecessor[k] = index into `indices` of the predecessor of
  // indices[k] in the LIS, or -1 if none.
  std::vector<int> predecessor(indices.size(), -1);

  tails.reserve(indices.size());
  tailIndices.reserve(indices.size());

  for (size_t k = 0; k < indices.size(); k++) {
    size_t val = values[indices[k]];

    // Binary search for the first element in tails >= val.
    auto it = std::lower_bound(tails.begin(), tails.end(), val);
    auto pos = static_cast<size_t>(it - tails.begin());

    if (it == tails.end()) {
      tails.push_back(val);
      tailIndices.push_back(k);
    } else {
      *it = val;
      tailIndices[pos] = k;
    }

    if (pos > 0) {
      predecessor[k] = static_cast<int>(tailIndices[pos - 1]);
    }
  }

  // Reconstruct LIS by tracing predecessors from the last element.
  int current = static_cast<int>(tailIndices.back());
  while (current >= 0) {
    inLIS[indices[static_cast<size_t>(current)]] = true;
    current = predecessor[static_cast<size_t>(current)];
  }

  return inLIS;
}

} // namespace facebook::react
