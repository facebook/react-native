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

#pragma once

#include <limits>
#include <tuple>
#include <type_traits>

// tupleRange<start, n>(tuple): select n elements starting at index start
//    in the given tuple
// tupleRange<start>(tuple): select all elements starting at index start
//    until the end of the given tuple
// tuplePrepend(x, tuple): return a tuple obtained by prepending x to the
//    given tuple.
//
// In Lisp lingo, std::get<0> is car, tupleRange<1> is cdr, and tuplePrepend
// is cons.

namespace folly {

// TemplateSeq<T, ...> is a type parametrized by sizeof...(Xs) values of type
// T. Used to destructure the values into a template parameter pack;
// see the example in TupleSelect, below.
template <class T, T... xs>
struct TemplateSeq {
  template <T x>
  using Prepend = TemplateSeq<T, x, xs...>;
};

// TemplateRange<T, start, n>::type is
// TemplateSeq<T, start+1, start+2, ..., start+n-1>
template <class T, T start, T n, class Enable = void>
struct TemplateRange;

template <class T, T start, T n>
struct TemplateRange<T, start, n, typename std::enable_if<(n > 0)>::type> {
  using type =
      typename TemplateRange<T, start + 1, n - 1>::type::template Prepend<
          start>;
};

template <class T, T start, T n>
struct TemplateRange<T, start, n, typename std::enable_if<(n <= 0)>::type> {
  using type = TemplateSeq<T>;
};

// Similar to TemplateRange, given a tuple T,
// TemplateTupleRange<T, start, n>::type is
// TemplateSeq<size_t, start, start+1, ..., start+k-1>
// where k = min(tuple_size<T>::value - start, n)
// (that is, it's a TemplateSeq of at most n elements, but won't extend
// past the end of the given tuple)
template <
    class T,
    std::size_t start = 0,
    std::size_t n = std::numeric_limits<std::size_t>::max(),
    std::size_t size =
        std::tuple_size<typename std::remove_reference<T>::type>::value,
    class Enable = typename std::enable_if<(start <= size)>::type>
struct TemplateTupleRange {
  using type = typename TemplateRange<
      std::size_t,
      start,
      (n <= size - start ? n : size - start)>::type;
};

namespace detail {

// Helper class to select a subset of a tuple
template <class S>
struct TupleSelect;
template <std::size_t... Ns>
struct TupleSelect<TemplateSeq<std::size_t, Ns...>> {
  template <class T>
  static auto select(T&& v)
      -> decltype(std::make_tuple(std::get<Ns>(std::forward<T>(v))...)) {
    return std::make_tuple(std::get<Ns>(std::forward<T>(v))...);
  }
};

} // namespace detail

// Return a tuple consisting of the elements at a range of indices.
//
// Use as tupleRange<start, n>(t) to return a tuple of (at most) n
// elements starting at index start in tuple t.
// If only start is specified (tupleRange<start>(t)), returns all elements
// starting at index start until the end of the tuple t.
// Won't compile if start > size of t.
// Will return fewer elements (size - start) if start + n > size of t.
template <
    std::size_t start = 0,
    std::size_t n = std::numeric_limits<std::size_t>::max(),
    class T,
    class Seq = typename TemplateTupleRange<T, start, n>::type>
auto tupleRange(T&& v)
    -> decltype(detail::TupleSelect<Seq>::select(std::forward<T>(v))) {
  return detail::TupleSelect<Seq>::select(std::forward<T>(v));
}

// Return a tuple obtained by prepending car to the tuple cdr.
template <class T, class U>
auto tuplePrepend(T&& car, U&& cdr) -> decltype(std::tuple_cat(
    std::make_tuple(std::forward<T>(car)),
    std::forward<U>(cdr))) {
  return std::tuple_cat(
      std::make_tuple(std::forward<T>(car)), std::forward<U>(cdr));
}

} // namespace folly
