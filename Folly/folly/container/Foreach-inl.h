/*
 * Copyright 2017-present Facebook, Inc.
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

#include <cassert>
#include <cstdint>
#include <initializer_list>
#include <iterator>
#include <tuple>
#include <type_traits>
#include <utility>

#include <folly/Portability.h>
#include <folly/Traits.h>
#include <folly/Utility.h>
#include <folly/functional/Invoke.h>

namespace folly {

namespace for_each_detail {

namespace adl {

/* using override */
using std::begin;
/* using override */
using std::end;
/* using override */
using std::get;

/**
 * The adl_ functions below lookup the function name in the namespace of the
 * type of the object being passed into the function. If no function with that
 * name exists for the passed object then the default std:: versions are going
 * to be called
 */
template <std::size_t Index, typename Type>
auto adl_get(Type&& instance) -> decltype(get<Index>(std::declval<Type>())) {
  return get<Index>(std::forward<Type>(instance));
}
template <typename Type>
auto adl_begin(Type&& instance) -> decltype(begin(instance)) {
  return begin(instance);
}
template <typename Type>
auto adl_end(Type&& instance) -> decltype(end(instance)) {
  return end(instance);
}

} // namespace adl

/**
 * Enable if the tuple supports fetching via a member get<>()
 */
template <typename T>
using EnableIfMemberGetFound =
    void_t<decltype(std::declval<T>().template get<0>())>;
template <typename, typename T>
struct IsMemberGetFound : std::false_type {};
template <typename T>
struct IsMemberGetFound<EnableIfMemberGetFound<T>, T> : std::true_type {};

/**
 * A get that tries member get<> first and if that is not found tries ADL get<>.
 * This mechanism is as found in the structured bindings proposal here 11.5.3.
 * http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2017/n4659.pdf
 */
template <
    std::size_t Index,
    typename Type,
    std::enable_if_t<!IsMemberGetFound<void, Type>::value, int> = 0>
auto get_impl(Type&& instance)
    -> decltype(adl::adl_get<Index>(static_cast<Type&&>(instance))) {
  return adl::adl_get<Index>(static_cast<Type&&>(instance));
}
template <
    std::size_t Index,
    typename Type,
    std::enable_if_t<IsMemberGetFound<void, Type>::value, int> = 0>
auto get_impl(Type&& instance)
    -> decltype(static_cast<Type&&>(instance).template get<Index>()) {
  return static_cast<Type&&>(instance).template get<Index>();
}

/**
 * Check if the sequence is a tuple
 */
template <typename Type, typename T = typename std::decay<Type>::type>
using EnableIfTuple = void_t<
    decltype(get_impl<0>(std::declval<T>())),
    decltype(std::tuple_size<T>::value)>;
template <typename, typename T>
struct IsTuple : std::false_type {};
template <typename T>
struct IsTuple<EnableIfTuple<T>, T> : std::true_type {};

/**
 * Check if the sequence is a range
 */
template <typename Type, typename T = typename std::decay<Type>::type>
using EnableIfRange = void_t<
    decltype(adl::adl_begin(std::declval<T>())),
    decltype(adl::adl_end(std::declval<T>()))>;
template <typename, typename T>
struct IsRange : std::false_type {};
template <typename T>
struct IsRange<EnableIfRange<T>, T> : std::true_type {};

struct TupleTag {};
struct RangeTag {};

/**
 * Should ideally check if it is a tuple and if not return void, but msvc fails
 */
template <typename Sequence>
using SequenceTag =
    std::conditional_t<IsRange<void, Sequence>::value, RangeTag, TupleTag>;

struct BeginAddTag {};
struct IndexingTag {};

template <typename Func, typename Item, typename Iter>
using ForEachImplTag = std::conditional_t<
    is_invocable<Func, Item, index_constant<0>, Iter>::value,
    index_constant<3>,
    std::conditional_t<
        is_invocable<Func, Item, index_constant<0>>::value,
        index_constant<2>,
        std::conditional_t<
            is_invocable<Func, Item>::value,
            index_constant<1>,
            void>>>;

template <
    typename Func,
    typename... Args,
    std::enable_if_t<is_invocable_r<LoopControl, Func, Args...>::value, int> =
        0>
LoopControl invoke_returning_loop_control(Func&& f, Args&&... a) {
  return static_cast<Func&&>(f)(static_cast<Args&&>(a)...);
}
template <
    typename Func,
    typename... Args,
    std::enable_if_t<!is_invocable_r<LoopControl, Func, Args...>::value, int> =
        0>
LoopControl invoke_returning_loop_control(Func&& f, Args&&... a) {
  static_assert(
      std::is_void<invoke_result_t<Func, Args...>>::value,
      "return either LoopControl or void");
  return static_cast<Func&&>(f)(static_cast<Args&&>(a)...), loop_continue;
}

/**
 * Implementations for the runtime function
 */
template <typename Sequence, typename Func>
void for_each_range_impl(index_constant<3>, Sequence&& range, Func& func) {
  auto first = adl::adl_begin(range);
  auto last = adl::adl_end(range);
  for (auto index = std::size_t{0}; first != last; ++index) {
    auto next = std::next(first);
    auto control = invoke_returning_loop_control(func, *first, index, first);
    if (loop_break == control) {
      break;
    }
    first = next;
  }
}
template <typename Sequence, typename Func>
void for_each_range_impl(index_constant<2>, Sequence&& range, Func& func) {
  // make a three arg adaptor for the function passed in so that the main
  // implementation function can be used
  auto three_arg_adaptor = [&func](
                               auto&& ele, auto index, auto) -> decltype(auto) {
    return func(std::forward<decltype(ele)>(ele), index);
  };
  for_each_range_impl(
      index_constant<3>{}, std::forward<Sequence>(range), three_arg_adaptor);
}

template <typename Sequence, typename Func>
void for_each_range_impl(index_constant<1>, Sequence&& range, Func& func) {
  // make a three argument adaptor for the function passed in that just ignores
  // the second and third argument
  auto three_arg_adaptor = [&func](auto&& ele, auto, auto) -> decltype(auto) {
    return func(std::forward<decltype(ele)>(ele));
  };
  for_each_range_impl(
      index_constant<3>{}, std::forward<Sequence>(range), three_arg_adaptor);
}

/**
 * Handlers for iteration
 */
template <typename Sequence, typename Func, std::size_t... Indices>
void for_each_tuple_impl(
    index_sequence<Indices...>,
    Sequence&& seq,
    Func& func) {
  using _ = int[];

  // unroll the loop in an initializer list construction parameter expansion
  // pack
  auto control = loop_continue;

  // cast to void to ignore the result; use the int[] initialization to do the
  // loop execution, the ternary conditional will decide whether or not to
  // evaluate the result
  //
  // if func does not return loop-control, expect the optimizer to see through
  // invoke_returning_loop_control always returning loop_continue
  void(
      _{(((control == loop_continue)
              ? (control = invoke_returning_loop_control(
                     func,
                     get_impl<Indices>(std::forward<Sequence>(seq)),
                     index_constant<Indices>{}))
              : (loop_continue)),
         0)...});
}

/**
 * The two top level compile time loop iteration functions handle the dispatch
 * based on the number of arguments the passed in function can be passed, if 2
 * arguments can be passed then the implementation dispatches work further to
 * the implementation classes above. If not then an adaptor is constructed
 * which is passed on to the 2 argument specialization, which then in turn
 * forwards implementation to the implementation classes above
 */
template <typename Sequence, typename Func>
void for_each_tuple_impl(index_constant<2>, Sequence&& seq, Func& func) {
  // pass the length as an index sequence to the implementation as an
  // optimization over manual template "tail recursion" unrolling
  using size = std::tuple_size<typename std::decay<Sequence>::type>;
  for_each_tuple_impl(
      make_index_sequence<size::value>{}, std::forward<Sequence>(seq), func);
}
template <typename Sequence, typename Func>
void for_each_tuple_impl(index_constant<1>, Sequence&& seq, Func& func) {
  // make an adaptor for the function passed in, in case it can only be passed
  // on argument
  auto two_arg_adaptor = [&func](auto&& ele, auto) -> decltype(auto) {
    return func(std::forward<decltype(ele)>(ele));
  };
  for_each_tuple_impl(
      index_constant<2>{}, std::forward<Sequence>(seq), two_arg_adaptor);
}

/**
 * Top level handlers for the for_each loop, with one overload for tuples and
 * one overload for ranges
 *
 * This implies that if type is both a range and a tuple, it is treated as a
 * range rather than as a tuple
 */
template <typename Sequence, typename Func>
static void for_each_impl(TupleTag, Sequence&& range, Func& func) {
  using type = decltype(get_impl<0>(std::declval<Sequence>()));
  using tag = ForEachImplTag<Func, type, void>;
  static_assert(!std::is_same<tag, void>::value, "unknown invocability");
  for_each_tuple_impl(tag{}, std::forward<Sequence>(range), func);
}
template <typename Sequence, typename Func>
static void for_each_impl(RangeTag, Sequence&& range, Func& func) {
  using iter = decltype(adl::adl_begin(std::declval<Sequence>()));
  using type = decltype(*std::declval<iter>());
  using tag = ForEachImplTag<Func, type, iter>;
  static_assert(!std::is_same<tag, void>::value, "unknown invocability");
  for_each_range_impl(tag{}, std::forward<Sequence>(range), func);
}

template <typename Sequence, typename Index>
decltype(auto) fetch_impl(IndexingTag, Sequence&& sequence, Index&& index) {
  return std::forward<Sequence>(sequence)[std::forward<Index>(index)];
}
template <typename Sequence, typename Index>
decltype(auto) fetch_impl(BeginAddTag, Sequence&& sequence, Index index) {
  return *(adl::adl_begin(std::forward<Sequence>(sequence)) + index);
}

template <typename Sequence, typename Index>
decltype(auto) fetch_impl(TupleTag, Sequence&& sequence, Index index) {
  return get_impl<index>(std::forward<Sequence>(sequence));
}
template <typename Sequence, typename Index>
decltype(auto) fetch_impl(RangeTag, Sequence&& sequence, Index&& index) {
  using iter = decltype(adl::adl_begin(std::declval<Sequence>()));
  using iter_traits = std::iterator_traits<remove_cvref_t<iter>>;
  using iter_cat = typename iter_traits::iterator_category;
  using tag = std::conditional_t<
      std::is_same<iter_cat, std::random_access_iterator_tag>::value,
      BeginAddTag,
      IndexingTag>;
  return fetch_impl(
      tag{}, std::forward<Sequence>(sequence), std::forward<Index>(index));
}

} // namespace for_each_detail

template <typename Sequence, typename Func>
FOLLY_CPP14_CONSTEXPR Func for_each(Sequence&& sequence, Func func) {
  namespace fed = for_each_detail;
  using tag = fed::SequenceTag<Sequence>;
  fed::for_each_impl(tag{}, std::forward<Sequence>(sequence), func);
  return func;
}

template <typename Sequence, typename Index>
FOLLY_CPP14_CONSTEXPR decltype(auto) fetch(Sequence&& sequence, Index&& index) {
  namespace fed = for_each_detail;
  using tag = fed::SequenceTag<Sequence>;
  return for_each_detail::fetch_impl(
      tag{}, std::forward<Sequence>(sequence), std::forward<Index>(index));
}

} // namespace folly
