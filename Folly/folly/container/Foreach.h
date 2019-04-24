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

#pragma once

#include <folly/Portability.h>
#include <folly/Preprocessor.h>

#include <type_traits>

namespace folly {

/**
 * @function for_each
 *
 * folly::for_each is a generalized iteration algorithm. Example:
 *
 *  auto one = std::make_tuple(1, 2, 3);
 *  auto two = std::vector<int>{1, 2, 3};
 *  auto func = [](auto element, auto index) {
 *    cout << index << " : " << element << endl;
 *  };
 *  folly::for_each(one, func);
 *  folly::for_each(two, func);
 *
 * The for_each function allows iteration through sequences, these can either be
 * runtime sequences (i.e. entities for which std::begin and std::end work) or
 * compile time sequences (as deemed by the presence of std::tuple_length<> and
 * member get<> or ADL get<> functions).
 *
 * If a sequence type is both a runtime sequence (aka range) and a compile-time
 * sequence (aka tuple), then it is treated as a range in preference to a tuple.
 * An example of such a type is std::array.
 *
 * The function is made to provide a convenient library based alternative to the
 * proposal p0589r0, which aims to generalize the range based for loop even
 * further to work with compile time sequences.
 *
 * A drawback of using range based for loops is that sometimes you do not have
 * access to the index within the range. This provides easy access to that, even
 * with compile time sequences.
 *
 * And breaking out is easy:
 *
 *  auto range_one = std::vector<int>{1, 2, 3};
 *  auto range_two = std::make_tuple(1, 2, 3);
 *  auto func = [](auto ele, auto index) {
 *    cout << "Element at index " << index << " : " << ele;
 *    if (index == 1) {
 *      return folly::loop_break;
 *    }
 *    return folly::loop_continue;
 *  };
 *  folly_for_each(range_one, func);
 *  folly_for_each(range_two, func);
 *
 * A simple use case would be when using futures, if the user was doing calls to
 * n servers then they would accept the callback with the futures like this:
 *
 *  auto vec = std::vector<std::future<int>>{request_one(), ...};
 *  when_all(vec.begin(), vec.end()).then([](auto futures) {
 *    folly::for_each(futures, [](auto& fut) { ... });
 *  });
 *
 * Now when this code switches to use tuples instead of the runtime std::vector,
 * then the loop does not need to change, the code will still work just fine:
 *
 *  when_all(future_one, future_two, future_three).then([](auto futures) {
 *    folly::for_each(futures, [](auto& fut) { ... });
 *  });
 */
template <typename Range, typename Func>
FOLLY_CPP14_CONSTEXPR Func for_each(Range&& range, Func func);

/**
 * The user should return loop_break and loop_continue if they want to iterate
 * in such a way that they can preemptively stop the loop and break out when
 * certain conditions are met.
 */
namespace for_each_detail {
enum class LoopControl : bool { BREAK, CONTINUE };
} // namespace for_each_detail

constexpr auto loop_break = for_each_detail::LoopControl::BREAK;
constexpr auto loop_continue = for_each_detail::LoopControl::CONTINUE;

/**
 * Utility method to help access elements of a sequence with one uniform
 * interface.
 *
 * This can be useful for example when you are looping through a sequence and
 * want to modify another sequence based on the information in the current
 * sequence:
 *
 *  auto range_one = std::make_tuple(1, 2, 3);
 *  auto range_two = std::make_tuple(4, 5, 6);
 *  folly::for_each(range_one, [&range_two](auto ele, auto index) {
 *    folly::fetch(range_two, index) = ele;
 *  });
 *
 * For ranges, this works by first trying to use the iterator class if the
 * iterator has been marked to be a random access iterator. This should be
 * inspectable via the std::iterator_traits traits class. If the iterator class
 * is not present or is not a random access iterator then the implementation
 * falls back to trying to use the indexing operator (operator[]) to fetch the
 * required element.
 */
template <typename Sequence, typename Index>
FOLLY_CPP14_CONSTEXPR decltype(auto) fetch(Sequence&& sequence, Index&& index);

} // namespace folly

/**
 * Everything below is deprecated.
 */

/*
 * Form a local variable name from "FOR_EACH_" x __LINE__, so that
 * FOR_EACH can be nested without creating shadowed declarations.
 */
#define _FE_ANON(x) FB_CONCATENATE(FOR_EACH_, FB_CONCATENATE(x, __LINE__))

/*
 * If you just want the element values, please use:
 *
 *    for (auto&& element : collection)
 *
 * If you need access to the iterators please write an explicit iterator loop
 */
#define FOR_EACH(i, c)                                                     \
  if (bool _FE_ANON(s1_) = false) {                                        \
  } else                                                                   \
    for (auto&& _FE_ANON(s2_) = (c); !_FE_ANON(s1_); _FE_ANON(s1_) = true) \
      for (auto i = _FE_ANON(s2_).begin(); i != _FE_ANON(s2_).end(); ++i)

/*
 * If you just want the element values, please use this (ranges-v3) construct:
 *
 *    for (auto&& element : collection | view::reverse)
 *
 * If you need access to the iterators please write an explicit iterator loop
 */
#define FOR_EACH_R(i, c)                                                   \
  if (bool _FE_ANON(s1_) = false) {                                        \
  } else                                                                   \
    for (auto&& _FE_ANON(s2_) = (c); !_FE_ANON(s1_); _FE_ANON(s1_) = true) \
      for (auto i = _FE_ANON(s2_).rbegin(); i != _FE_ANON(s2_).rend(); ++i)

/*
 * If you just want the element values, please use this construct:
 *
 *    for (auto&& element : folly::enumerate(collection))
 *
 * If you need access to the iterators please write an explicit iterator loop
 * and use a counter variable
 */
#define FOR_EACH_ENUMERATE(count, i, c)                                      \
  if (bool _FE_ANON(s1_) = false) {                                          \
  } else                                                                     \
    for (auto&& FOR_EACH_state2 = (c); !_FE_ANON(s1_); _FE_ANON(s1_) = true) \
      if (size_t _FE_ANON(n1_) = 0) {                                        \
      } else if (const size_t& count = _FE_ANON(n1_)) {                      \
      } else                                                                 \
        for (auto i = FOR_EACH_state2.begin(); i != FOR_EACH_state2.end();   \
             ++_FE_ANON(n1_), ++i)
/**
 * If you just want the keys, please use this (ranges-v3) construct:
 *
 *    for (auto&& element : collection | view::keys)
 *
 * If you just want the values, please use this (ranges-v3) construct:
 *
 *    for (auto&& element : collection | view::values)
 *
 * If you need to see both, use:
 *
 *    for (auto&& element : collection) {
 *      auto const& key = element.first;
 *      auto& value = element.second;
 *      ......
 *    }
 *
 */
#define FOR_EACH_KV(k, v, c)                                                  \
  if (unsigned int _FE_ANON(s1_) = 0) {                                       \
  } else                                                                      \
    for (auto&& _FE_ANON(s2_) = (c); !_FE_ANON(s1_); _FE_ANON(s1_) = 1)       \
      for (auto _FE_ANON(s3_) = _FE_ANON(s2_).begin();                        \
           _FE_ANON(s3_) != _FE_ANON(s2_).end();                              \
           _FE_ANON(s1_) == 2 ? ((_FE_ANON(s1_) = 0), ++_FE_ANON(s3_))        \
                              : (_FE_ANON(s3_) = _FE_ANON(s2_).end()))        \
        for (auto& k = _FE_ANON(s3_)->first; !_FE_ANON(s1_); ++_FE_ANON(s1_)) \
          for (auto& v = _FE_ANON(s3_)->second; !_FE_ANON(s1_); ++_FE_ANON(s1_))

namespace folly {
namespace detail {

// Boost 1.48 lacks has_less, we emulate a subset of it here.
template <typename T, typename U>
class HasLess {
  struct BiggerThanChar {
    char unused[2];
  };
  template <typename C, typename D>
  static char test(decltype(C() < D())*);
  template <typename, typename>
  static BiggerThanChar test(...);

 public:
  enum { value = sizeof(test<T, U>(nullptr)) == 1 };
};

/**
 * notThereYet helps the FOR_EACH_RANGE macro by opportunistically
 * using "<" instead of "!=" whenever available when checking for loop
 * termination. This makes e.g. examples such as FOR_EACH_RANGE (i,
 * 10, 5) execute zero iterations instead of looping virtually
 * forever. At the same time, some iterator types define "!=" but not
 * "<". The notThereYet function will dispatch differently for those.
 *
 * Below is the correct implementation of notThereYet. It is disabled
 * because of a bug in Boost 1.46: The filesystem::path::iterator
 * defines operator< (via boost::iterator_facade), but that in turn
 * uses distance_to which is undefined for that particular
 * iterator. So HasLess (defined above) identifies
 * boost::filesystem::path as properly comparable with <, but in fact
 * attempting to do so will yield a compile-time error.
 *
 * The else branch (active) contains a conservative
 * implementation.
 */

#if 0

template <class T, class U>
typename std::enable_if<HasLess<T, U>::value, bool>::type
notThereYet(T& iter, const U& end) {
  return iter < end;
}

template <class T, class U>
typename std::enable_if<!HasLess<T, U>::value, bool>::type
notThereYet(T& iter, const U& end) {
  return iter != end;
}

#else

template <class T, class U>
typename std::enable_if<
    (std::is_arithmetic<T>::value && std::is_arithmetic<U>::value) ||
        (std::is_pointer<T>::value && std::is_pointer<U>::value),
    bool>::type
notThereYet(T& iter, const U& end) {
  return iter < end;
}

template <class T, class U>
typename std::enable_if<
    !((std::is_arithmetic<T>::value && std::is_arithmetic<U>::value) ||
      (std::is_pointer<T>::value && std::is_pointer<U>::value)),
    bool>::type
notThereYet(T& iter, const U& end) {
  return iter != end;
}

#endif

/**
 * downTo is similar to notThereYet, but in reverse - it helps the
 * FOR_EACH_RANGE_R macro.
 */
template <class T, class U>
typename std::enable_if<HasLess<U, T>::value, bool>::type downTo(
    T& iter,
    const U& begin) {
  return begin < iter--;
}

template <class T, class U>
typename std::enable_if<!HasLess<U, T>::value, bool>::type downTo(
    T& iter,
    const U& begin) {
  if (iter == begin) {
    return false;
  }
  --iter;
  return true;
}

} // namespace detail
} // namespace folly

/*
 * Look at the Ranges-v3 views and you'll probably find an easier way to build
 * the view you want but the equivalent is roughly:
 *
 *    for (auto& element : make_iterator_range(begin, end))
 */
#define FOR_EACH_RANGE(i, begin, end)          \
  for (auto i = (true ? (begin) : (end));      \
       ::folly::detail::notThereYet(i, (end)); \
       ++i)

/*
 * Look at the Ranges-v3 views and you'll probably find an easier way to build
 * the view you want but the equivalent is roughly:
 *
 *    for (auto& element : make_iterator_range(begin, end) | view::reverse)
 */
#define FOR_EACH_RANGE_R(i, begin, end) \
  for (auto i = (false ? (begin) : (end)); ::folly::detail::downTo(i, (begin));)

#include <folly/container/Foreach-inl.h>
