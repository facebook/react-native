/*
 * Copyright 2017 Facebook, Inc.
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

/*
 * folly::merge() is an implementation of std::merge with one additonal
 * guarantee: if the input ranges overlap, the order that values *from the two
 * different ranges* appear in the output is well defined (std::merge only
 * guarantees relative ordering is maintained within a single input range).
 * This semantic is very useful when the output container removes duplicates
 * (such as std::map) to guarantee that elements from b override elements from
 * a.
 *
 * ex. Let's say we have two vector<pair<int, int>> as input, and we are
 * merging into a vector<pair<int, int>>. The comparator is returns true if the
 * first argument has a lesser 'first' value in the pair.
 *
 * a = {{1, 1}, {2, 2}, {3, 3}};
 * b = {{1, 2}, {2, 3}};
 *
 * folly::merge<...>(a.begin(), a.end(), b.begin(), b.end(), outputIter) is
 * guaranteed to produce {{1, 1}, {1, 2}, {2, 2}, {2, 3}, {3, 3}}. That is,
 * if comp(it_a, it_b) == comp(it_b, it_a) == false, we first insert the element
 * from a.
 */

#pragma once

#include <algorithm>

namespace folly {

template<class InputIt1, class InputIt2, class OutputIt, class Compare>
OutputIt merge(InputIt1 first1, InputIt1 last1,
               InputIt2 first2, InputIt2 last2,
               OutputIt d_first, Compare comp) {
  for (; first1 != last1; ++d_first) {
    if (first2 == last2) {
      return std::copy(first1, last1, d_first);
    }
    if (comp(*first2, *first1)) {
      *d_first = *first2;
      ++first2;
    } else {
      *d_first = *first1;
      ++first1;
    }
  }
  return std::copy(first2, last2, d_first);
}

template<class InputIt1, class InputIt2, class OutputIt>
OutputIt merge(InputIt1 first1, InputIt1 last1,
               InputIt2 first2, InputIt2 last2,
               OutputIt d_first) {
  for (; first1 != last1; ++d_first) {
    if (first2 == last2) {
      return std::copy(first1, last1, d_first);
    }
    if (*first2 < *first1) {
      *d_first = *first2;
      ++first2;
    } else {
      *d_first = *first1;
      ++first1;
    }
  }
  return std::copy(first2, last2, d_first);
}

}
