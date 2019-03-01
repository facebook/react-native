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

#pragma once

#include <utility>
#include <type_traits>

#include <folly/Optional.h>

namespace folly {

//////////////////////////////////////////////////////////////////////

/*
 * Lazy -- for delayed initialization of a value.  The value's
 * initialization will be computed on demand at its first use, but
 * will not be recomputed if its value is requested again.  The value
 * may still be mutated after its initialization if the lazy is not
 * declared const.
 *
 * The value is created using folly::lazy, usually with a lambda, and
 * its value is requested using operator().
 *
 * Note that the value is not safe for concurrent accesses by multiple
 * threads, even if you declare it const.  See note below.
 *
 *
 * Example Usage:
 *
 *   void foo() {
 *     auto const val = folly::lazy([&]{
 *       return something_expensive(blah());
 *     });
 *
 *     if (condition1) {
 *       use(val());
 *     }
 *     if (condition2) {
 *       useMaybeAgain(val());
 *     } else {
 *       // Unneeded in this branch.
 *     }
 *   }
 *
 *
 * Rationale:
 *
 *    - operator() is used to request the value instead of an implicit
 *      conversion because the slight syntactic overhead in common
 *      seems worth the increased clarity.
 *
 *    - Lazy values do not model CopyConstructible because it is
 *      unclear what semantics would be desirable.  Either copies
 *      should share the cached value (adding overhead to cases that
 *      don't need to support copies), or they could recompute the
 *      value unnecessarily.  Sharing with mutable lazies would also
 *      leave them with non-value semantics despite looking
 *      value-like.
 *
 *    - Not thread safe for const accesses.  Many use cases for lazy
 *      values are local variables on the stack, where multiple
 *      threads shouldn't even be able to reach the value.  It still
 *      is useful to indicate/check that the value doesn't change with
 *      const, particularly when it is captured by a large family of
 *      lambdas.  Adding internal synchronization seems like it would
 *      pessimize the most common use case in favor of less likely use
 *      cases.
 *
 */

//////////////////////////////////////////////////////////////////////

namespace detail {

template<class Func>
struct Lazy {
  typedef typename std::result_of<Func()>::type result_type;

  explicit Lazy(Func&& f) : func_(std::move(f)) {}
  explicit Lazy(Func& f)  : func_(f) {}

  Lazy(Lazy&& o)
    : value_(std::move(o.value_))
    , func_(std::move(o.func_))
  {}

  Lazy(const Lazy&) = delete;
  Lazy& operator=(const Lazy&) = delete;
  Lazy& operator=(Lazy&&) = delete;

  const result_type& operator()() const {
    return const_cast<Lazy&>(*this)();
  }

  result_type& operator()() {
    if (!value_) value_ = func_();
    return *value_;
  }

private:
  Optional<result_type> value_;
  Func func_;
};

}

//////////////////////////////////////////////////////////////////////

template<class Func>
detail::Lazy<typename std::remove_reference<Func>::type>
lazy(Func&& fun) {
  return detail::Lazy<typename std::remove_reference<Func>::type>(
    std::forward<Func>(fun)
  );
}

//////////////////////////////////////////////////////////////////////

}
