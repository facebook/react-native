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

#include <atomic>
#include <tuple>
#include <utility>

#include <folly/Portability.h>
#include <folly/Try.h>
#include <folly/functional/Invoke.h>
#include <folly/futures/Future.h>
#include <folly/futures/Promise.h>

namespace folly {

/// This namespace is for utility functions that would usually be static
/// members of Future, except they don't make sense there because they don't
/// depend on the template type (rather, on the type of their arguments in
/// some cases). This is the least-bad naming scheme we could think of. Some
/// of the functions herein have really-likely-to-collide names, like "map"
/// and "sleep".
namespace futures {
/// Returns a Future that will complete after the specified duration. The
/// Duration typedef of a `std::chrono` duration type indicates the
/// resolution you can expect to be meaningful (milliseconds at the time of
/// writing). Normally you wouldn't need to specify a Timekeeper, we will
/// use the global futures timekeeper (we run a thread whose job it is to
/// keep time for futures timeouts) but we provide the option for power
/// users.
///
/// The Timekeeper thread will be lazily created the first time it is
/// needed. If your program never uses any timeouts or other time-based
/// Futures you will pay no Timekeeper thread overhead.
Future<Unit> sleep(Duration, Timekeeper* = nullptr);

/**
 * Set func as the callback for each input Future and return a vector of
 * Futures containing the results in the input order.
 */
template <
    class It,
    class F,
    class ItT = typename std::iterator_traits<It>::value_type,
    class Result = typename decltype(
        std::declval<ItT>().then(std::declval<F>()))::value_type>
std::vector<Future<Result>> map(It first, It last, F func);

/**
 * Set func as the callback for each input Future and return a vector of
 * Futures containing the results in the input order and completing on
 * exec.
 */
template <
    class It,
    class F,
    class ItT = typename std::iterator_traits<It>::value_type,
    class Result = typename decltype(std::move(std::declval<ItT>())
                                         .via(std::declval<Executor*>())
                                         .then(std::declval<F>()))::value_type>
std::vector<Future<Result>> map(Executor& exec, It first, It last, F func);

// Sugar for the most common case
template <class Collection, class F>
auto map(Collection&& c, F&& func) -> decltype(map(c.begin(), c.end(), func)) {
  return map(c.begin(), c.end(), std::forward<F>(func));
}

// Sugar for the most common case
template <class Collection, class F>
auto map(Executor& exec, Collection&& c, F&& func)
    -> decltype(map(exec, c.begin(), c.end(), func)) {
  return map(exec, c.begin(), c.end(), std::forward<F>(func));
}

} // namespace futures

/**
  Make a completed SemiFuture by moving in a value. e.g.

    string foo = "foo";
    auto f = makeSemiFuture(std::move(foo));

  or

    auto f = makeSemiFuture<string>("foo");
*/
template <class T>
SemiFuture<typename std::decay<T>::type> makeSemiFuture(T&& t);

/** Make a completed void SemiFuture. */
SemiFuture<Unit> makeSemiFuture();

/**
  Make a SemiFuture by executing a function.

  If the function returns a value of type T, makeSemiFutureWith
  returns a completed SemiFuture<T>, capturing the value returned
  by the function.

  If the function returns a SemiFuture<T> already, makeSemiFutureWith
  returns just that.

  Either way, if the function throws, a failed Future is
  returned that captures the exception.
*/

// makeSemiFutureWith(SemiFuture<T>()) -> SemiFuture<T>
template <class F>
typename std::enable_if<
    isFutureOrSemiFuture<invoke_result_t<F>>::value,
    SemiFuture<typename invoke_result_t<F>::value_type>>::type
makeSemiFutureWith(F&& func);

// makeSemiFutureWith(T()) -> SemiFuture<T>
// makeSemiFutureWith(void()) -> SemiFuture<Unit>
template <class F>
typename std::enable_if<
    !(isFutureOrSemiFuture<invoke_result_t<F>>::value),
    SemiFuture<typename lift_unit<invoke_result_t<F>>::type>>::type
makeSemiFutureWith(F&& func);

/// Make a failed Future from an exception_ptr.
/// Because the Future's type cannot be inferred you have to specify it, e.g.
///
///   auto f = makeSemiFuture<string>(std::current_exception());
template <class T>
[[deprecated("use makeSemiFuture(exception_wrapper)")]] SemiFuture<T>
makeSemiFuture(std::exception_ptr const& e);

/// Make a failed SemiFuture from an exception_wrapper.
template <class T>
SemiFuture<T> makeSemiFuture(exception_wrapper ew);

/** Make a SemiFuture from an exception type E that can be passed to
  std::make_exception_ptr(). */
template <class T, class E>
typename std::
    enable_if<std::is_base_of<std::exception, E>::value, SemiFuture<T>>::type
    makeSemiFuture(E const& e);

/** Make a Future out of a Try */
template <class T>
SemiFuture<T> makeSemiFuture(Try<T> t);

/**
  Make a completed Future by moving in a value. e.g.

    string foo = "foo";
    auto f = makeFuture(std::move(foo));

  or

    auto f = makeFuture<string>("foo");

  NOTE: This function is deprecated. Please use makeSemiFuture and pass the
       appropriate executor to .via on the returned SemiFuture to get a
       valid Future where necessary.
*/
template <class T>
Future<typename std::decay<T>::type> makeFuture(T&& t);

/**
  Make a completed void Future.

  NOTE: This function is deprecated. Please use makeSemiFuture and pass the
       appropriate executor to .via on the returned SemiFuture to get a
       valid Future where necessary.
 */
Future<Unit> makeFuture();

/**
  Make a Future by executing a function.

  If the function returns a value of type T, makeFutureWith
  returns a completed Future<T>, capturing the value returned
  by the function.

  If the function returns a Future<T> already, makeFutureWith
  returns just that.

  Either way, if the function throws, a failed Future is
  returned that captures the exception.

  Calling makeFutureWith(func) is equivalent to calling
  makeFuture().then(func).

  NOTE: This function is deprecated. Please use makeSemiFutureWith and pass the
       appropriate executor to .via on the returned SemiFuture to get a
       valid Future where necessary.
*/

// makeFutureWith(Future<T>()) -> Future<T>
template <class F>
typename std::
    enable_if<isFuture<invoke_result_t<F>>::value, invoke_result_t<F>>::type
    makeFutureWith(F&& func);

// makeFutureWith(T()) -> Future<T>
// makeFutureWith(void()) -> Future<Unit>
template <class F>
typename std::enable_if<
    !(isFuture<invoke_result_t<F>>::value),
    Future<typename lift_unit<invoke_result_t<F>>::type>>::type
makeFutureWith(F&& func);

/// Make a failed Future from an exception_ptr.
/// Because the Future's type cannot be inferred you have to specify it, e.g.
///
///   auto f = makeFuture<string>(std::current_exception());
template <class T>
[[deprecated("use makeSemiFuture(exception_wrapper)")]] Future<T> makeFuture(
    std::exception_ptr const& e);

/// Make a failed Future from an exception_wrapper.
/// NOTE: This function is deprecated. Please use makeSemiFuture and pass the
///     appropriate executor to .via on the returned SemiFuture to get a
///     valid Future where necessary.
template <class T>
Future<T> makeFuture(exception_wrapper ew);

/** Make a Future from an exception type E that can be passed to
  std::make_exception_ptr().

  NOTE: This function is deprecated. Please use makeSemiFuture and pass the
       appropriate executor to .via on the returned SemiFuture to get a
       valid Future where necessary.
 */
template <class T, class E>
typename std::enable_if<std::is_base_of<std::exception, E>::value, Future<T>>::
    type
    makeFuture(E const& e);

/**
  Make a Future out of a Try

  NOTE: This function is deprecated. Please use makeSemiFuture and pass the
       appropriate executor to .via on the returned SemiFuture to get a
       valid Future where necessary.
 */
template <class T>
Future<T> makeFuture(Try<T> t);

/*
 * Return a new Future that will call back on the given Executor.
 * This is just syntactic sugar for makeFuture().via(executor)
 *
 * @param executor the Executor to call back on
 * @param priority optionally, the priority to add with. Defaults to 0 which
 * represents medium priority.
 *
 * @returns a void Future that will call back on the given executor
 */
inline Future<Unit> via(
    Executor* executor,
    int8_t priority = Executor::MID_PRI);

inline Future<Unit> via(
    Executor::KeepAlive<> executor,
    int8_t priority = Executor::MID_PRI);

/// Execute a function via the given executor and return a future.
/// This is semantically equivalent to via(executor).then(func), but
/// easier to read and slightly more efficient.
template <class Func>
auto via(Executor*, Func&& func) -> Future<
    typename isFutureOrSemiFuture<decltype(std::declval<Func>()())>::Inner>;

template <class Func>
auto via(Executor::KeepAlive<>, Func&& func) -> Future<
    typename isFutureOrSemiFuture<decltype(std::declval<Func>()())>::Inner>;

/** When all the input Futures complete, the returned Future will complete.
  Errors do not cause early termination; this Future will always succeed
  after all its Futures have finished (whether successfully or with an
  error).

  The Futures are moved in, so your copies are invalid. If you need to
  chain further from these Futures, use the variant with an output iterator.

  This function is thread-safe for Futures running on different threads. But
  if you are doing anything non-trivial after, you will probably want to
  follow with `via(executor)` because it will complete in whichever thread the
  last Future completes in.

  The return type for Future<T> input is a Future<std::vector<Try<T>>>
  */
template <class InputIterator>
SemiFuture<std::vector<
    Try<typename std::iterator_traits<InputIterator>::value_type::value_type>>>
collectAllSemiFuture(InputIterator first, InputIterator last);

/// Sugar for the most common case
template <class Collection>
auto collectAllSemiFuture(Collection&& c)
    -> decltype(collectAllSemiFuture(c.begin(), c.end())) {
  return collectAllSemiFuture(c.begin(), c.end());
}

template <class InputIterator>
Future<std::vector<
    Try<typename std::iterator_traits<InputIterator>::value_type::value_type>>>
collectAll(InputIterator first, InputIterator last);

template <class Collection>
auto collectAll(Collection&& c) -> decltype(collectAll(c.begin(), c.end())) {
  return collectAll(c.begin(), c.end());
}

/// This version takes a varying number of Futures instead of an iterator.
/// The return type for (Future<T1>, Future<T2>, ...) input
/// is a Future<std::tuple<Try<T1>, Try<T2>, ...>>.
/// The Futures are moved in, so your copies are invalid.
template <typename... Fs>
SemiFuture<std::tuple<Try<typename remove_cvref_t<Fs>::value_type>...>>
collectAllSemiFuture(Fs&&... fs);

template <typename... Fs>
Future<std::tuple<Try<typename remove_cvref_t<Fs>::value_type>...>> collectAll(
    Fs&&... fs);
/// Like collectAll, but will short circuit on the first exception. Thus, the
/// type of the returned Future is std::vector<T> instead of
/// std::vector<Try<T>>
template <class InputIterator>
Future<std::vector<
    typename std::iterator_traits<InputIterator>::value_type::value_type>>
collect(InputIterator first, InputIterator last);

/// Sugar for the most common case
template <class Collection>
auto collect(Collection&& c) -> decltype(collect(c.begin(), c.end())) {
  return collect(c.begin(), c.end());
}

/// Like collectAll, but will short circuit on the first exception. Thus, the
/// type of the returned Future is std::tuple<T1, T2, ...> instead of
/// std::tuple<Try<T1>, Try<T2>, ...>
template <typename... Fs>
Future<std::tuple<typename remove_cvref_t<Fs>::value_type...>> collect(
    Fs&&... fs);

/** The result is a pair of the index of the first Future to complete and
  the Try. If multiple Futures complete at the same time (or are already
  complete when passed in), the "winner" is chosen non-deterministically.

  This function is thread-safe for Futures running on different threads.
  */
template <class InputIterator>
Future<std::pair<
    size_t,
    Try<typename std::iterator_traits<InputIterator>::value_type::value_type>>>
collectAny(InputIterator first, InputIterator last);

/// Sugar for the most common case
template <class Collection>
auto collectAny(Collection&& c) -> decltype(collectAny(c.begin(), c.end())) {
  return collectAny(c.begin(), c.end());
}

/** Similar to collectAny, collectAnyWithoutException return the first Future to
 * complete without exceptions. If none of the future complete without
 * excpetions, the last exception will be returned as a result.
 */
template <class InputIterator>
Future<std::pair<
    size_t,
    typename std::iterator_traits<InputIterator>::value_type::value_type>>
collectAnyWithoutException(InputIterator first, InputIterator last);

/// Sugar for the most common case
template <class Collection>
auto collectAnyWithoutException(Collection&& c)
    -> decltype(collectAnyWithoutException(c.begin(), c.end())) {
  return collectAnyWithoutException(c.begin(), c.end());
}

/** when n Futures have completed, the Future completes with a vector of
  the index and Try of those n Futures (the indices refer to the original
  order, but the result vector will be in an arbitrary order)

  Not thread safe.
  */
template <class InputIterator>
SemiFuture<std::vector<std::pair<
    size_t,
    Try<typename std::iterator_traits<InputIterator>::value_type::value_type>>>>
collectN(InputIterator first, InputIterator last, size_t n);

/// Sugar for the most common case
template <class Collection>
auto collectN(Collection&& c, size_t n)
    -> decltype(collectN(c.begin(), c.end(), n)) {
  return collectN(c.begin(), c.end(), n);
}

/** window creates up to n Futures using the values
    in the collection, and then another Future for each Future
    that completes

    this is basically a sliding window of Futures of size n

    func must return a Future for each value in input
  */
template <
    class Collection,
    class F,
    class ItT = typename std::iterator_traits<
        typename Collection::iterator>::value_type,
    class Result = typename invoke_result_t<F, ItT&&>::value_type>
std::vector<Future<Result>> window(Collection input, F func, size_t n);

template <
    class Collection,
    class F,
    class ItT = typename std::iterator_traits<
        typename Collection::iterator>::value_type,
    class Result = typename invoke_result_t<F, ItT&&>::value_type>
std::vector<Future<Result>>
window(Executor* executor, Collection input, F func, size_t n);

template <
    class Collection,
    class F,
    class ItT = typename std::iterator_traits<
        typename Collection::iterator>::value_type,
    class Result = typename invoke_result_t<F, ItT&&>::value_type>
std::vector<Future<Result>>
window(Executor::KeepAlive<> executor, Collection input, F func, size_t n);

template <typename F, typename T, typename ItT>
using MaybeTryArg = typename std::
    conditional<is_invocable<F, T&&, Try<ItT>&&>::value, Try<ItT>, ItT>::type;

/** repeatedly calls func on every result, e.g.
    reduce(reduce(reduce(T initial, result of first), result of second), ...)

    The type of the final result is a Future of the type of the initial value.

    Func can either return a T, or a Future<T>

    func is called in order of the input, see unorderedReduce if that is not
    a requirement
  */
template <class It, class T, class F>
Future<T> reduce(It first, It last, T&& initial, F&& func);

/// Sugar for the most common case
template <class Collection, class T, class F>
auto reduce(Collection&& c, T&& initial, F&& func) -> decltype(reduce(
    c.begin(),
    c.end(),
    std::forward<T>(initial),
    std::forward<F>(func))) {
  return reduce(
      c.begin(), c.end(), std::forward<T>(initial), std::forward<F>(func));
}

/** like reduce, but calls func on finished futures as they complete
    does NOT keep the order of the input
  */
template <class It, class T, class F>
Future<T> unorderedReduce(It first, It last, T initial, F func);

/// Sugar for the most common case
template <class Collection, class T, class F>
auto unorderedReduce(Collection&& c, T&& initial, F&& func)
    -> decltype(unorderedReduce(
        c.begin(),
        c.end(),
        std::forward<T>(initial),
        std::forward<F>(func))) {
  return unorderedReduce(
      c.begin(), c.end(), std::forward<T>(initial), std::forward<F>(func));
}
} // namespace folly
