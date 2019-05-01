/*
 * Copyright 2018-present Facebook, Inc.
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

#include <cstdint>

namespace folly {
namespace detail {

/*
 * Sorts a double[] array using radix sort (falling back to std::sort
 * for small arrays).
 *
 * n - size of array
 * buckets - must be array of uint64_t of size 256*9.
 * in & out - must be double arrays of size n.  in contains input data.
 *
 * output - in array is sorted.
 */
void double_radix_sort(uint64_t n, uint64_t* buckets, double* in, double* tmp);

} // namespace detail
} // namespace folly
