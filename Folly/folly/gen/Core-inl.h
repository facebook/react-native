/*
 * Copyright 2014-present Facebook, Inc.
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

#ifndef FOLLY_GEN_CORE_H_
#error This file may only be included from folly/gen/Core.h
#endif

#include <type_traits>
#include <utility>

#include <folly/Portability.h>

// Ignore shadowing warnings within this file, so includers can use -Wshadow.
FOLLY_PUSH_WARNING
FOLLY_GNU_DISABLE_WARNING("-Wshadow")

namespace folly {
namespace gen {

/**
 * IsCompatibleSignature - Trait type for testing whether a given Functor
 * matches an expected signature.
 *
 * Usage:
 *   IsCompatibleSignature<FunctorType, bool(int, float)>::value
 */
template <class Candidate, class Expected>
class IsCompatibleSignature {
  static constexpr bool value = false;
};

template <class Candidate, class ExpectedReturn, class... ArgTypes>
class IsCompatibleSignature<Candidate, ExpectedReturn(ArgTypes...)> {
  template <
      class F,
      class ActualReturn =
          decltype(std::declval<F>()(std::declval<ArgTypes>()...)),
      bool good = std::is_same<ExpectedReturn, ActualReturn>::value>
  static constexpr bool testArgs(int*) {
    return good;
  }

  template <class F>
  static constexpr bool testArgs(...) {
    return false;
  }

 public:
  static constexpr bool value = testArgs<Candidate>(nullptr);
};

/**
 * FBounded - Helper type for the curiously recurring template pattern, used
 * heavily here to enable inlining and obviate virtual functions
 */
template <class Self>
struct FBounded {
  const Self& self() const {
    return *static_cast<const Self*>(this);
  }

  Self& self() {
    return *static_cast<Self*>(this);
  }
};

/**
 * Operator - Core abstraction of an operation which may be applied to a
 * generator. All operators implement a method compose(), which takes a
 * generator and produces an output generator.
 */
template <class Self>
class Operator : public FBounded<Self> {
 public:
  /**
   * compose() - Must be implemented by child class to compose a new Generator
   * out of a given generator. This function left intentionally unimplemented.
   */
  template <class Source, class Value, class ResultGen = void>
  ResultGen compose(const GenImpl<Value, Source>& source) const;

 protected:
  Operator() = default;
  Operator(Operator&&) noexcept = default;
  Operator(const Operator&) = default;
  Operator& operator=(Operator&&) noexcept = default;
  Operator& operator=(const Operator&) = default;
};

/**
 * operator|() - For composing two operators without binding it to a
 * particular generator.
 */
template <
    class Left,
    class Right,
    class Composed = detail::Composed<Left, Right>>
Composed operator|(const Operator<Left>& left, const Operator<Right>& right) {
  return Composed(left.self(), right.self());
}

template <
    class Left,
    class Right,
    class Composed = detail::Composed<Left, Right>>
Composed operator|(const Operator<Left>& left, Operator<Right>&& right) {
  return Composed(left.self(), std::move(right.self()));
}

template <
    class Left,
    class Right,
    class Composed = detail::Composed<Left, Right>>
Composed operator|(Operator<Left>&& left, const Operator<Right>& right) {
  return Composed(std::move(left.self()), right.self());
}

template <
    class Left,
    class Right,
    class Composed = detail::Composed<Left, Right>>
Composed operator|(Operator<Left>&& left, Operator<Right>&& right) {
  return Composed(std::move(left.self()), std::move(right.self()));
}

/**
 * GenImpl - Core abstraction of a generator, an object which produces values by
 * passing them to a given handler lambda. All generator implementations must
 * implement apply(). foreach() may also be implemented to special case the
 * condition where the entire sequence is consumed.
 */
template <class Value, class Self>
class GenImpl : public FBounded<Self> {
 protected:
  // To prevent slicing
  GenImpl() = default;
  GenImpl(GenImpl&&) = default;
  GenImpl(const GenImpl&) = default;
  GenImpl& operator=(GenImpl&&) = default;
  GenImpl& operator=(const GenImpl&) = default;

 public:
  typedef Value ValueType;
  typedef typename std::decay<Value>::type StorageType;

  /**
   * apply() - Send all values produced by this generator to given handler until
   * the handler returns false. Returns false if and only if the handler passed
   * in returns false. Note: It should return true even if it completes (without
   * the handler returning false), as 'Chain' uses the return value of apply to
   * determine if it should process the second object in its chain.
   */
  template <class Handler>
  bool apply(Handler&& handler) const;

  /**
   * foreach() - Send all values produced by this generator to given lambda.
   */
  template <class Body>
  void foreach(Body&& body) const {
    this->self().apply([&](Value value) -> bool {
      static_assert(!infinite, "Cannot call foreach on infinite GenImpl");
      body(std::forward<Value>(value));
      return true;
    });
  }

  // Child classes should override if the sequence generated is *definitely*
  // infinite. 'infinite' may be false_type for some infinite sequences
  // (due the the Halting Problem).
  //
  // In general, almost all sources are finite (only seq(n) produces an infinite
  // source), almost all operators keep the finiteness of the source (only cycle
  // makes an infinite generator from a finite one, only until and take make a
  // finite generator from an infinite one, and concat needs both the inner and
  // outer generators to be finite to make a finite one), and most sinks
  // cannot accept and infinite generators (first being the expection).
  static constexpr bool infinite = false;
};

template <
    class LeftValue,
    class Left,
    class RightValue,
    class Right,
    class Chain = detail::Chain<LeftValue, Left, Right>>
Chain operator+(
    const GenImpl<LeftValue, Left>& left,
    const GenImpl<RightValue, Right>& right) {
  static_assert(
      std::is_same<LeftValue, RightValue>::value,
      "Generators may ony be combined if Values are the exact same type.");
  return Chain(left.self(), right.self());
}

template <
    class LeftValue,
    class Left,
    class RightValue,
    class Right,
    class Chain = detail::Chain<LeftValue, Left, Right>>
Chain operator+(
    const GenImpl<LeftValue, Left>& left,
    GenImpl<RightValue, Right>&& right) {
  static_assert(
      std::is_same<LeftValue, RightValue>::value,
      "Generators may ony be combined if Values are the exact same type.");
  return Chain(left.self(), std::move(right.self()));
}

template <
    class LeftValue,
    class Left,
    class RightValue,
    class Right,
    class Chain = detail::Chain<LeftValue, Left, Right>>
Chain operator+(
    GenImpl<LeftValue, Left>&& left,
    const GenImpl<RightValue, Right>& right) {
  static_assert(
      std::is_same<LeftValue, RightValue>::value,
      "Generators may ony be combined if Values are the exact same type.");
  return Chain(std::move(left.self()), right.self());
}

template <
    class LeftValue,
    class Left,
    class RightValue,
    class Right,
    class Chain = detail::Chain<LeftValue, Left, Right>>
Chain operator+(
    GenImpl<LeftValue, Left>&& left,
    GenImpl<RightValue, Right>&& right) {
  static_assert(
      std::is_same<LeftValue, RightValue>::value,
      "Generators may ony be combined if Values are the exact same type.");
  return Chain(std::move(left.self()), std::move(right.self()));
}

/**
 * operator|() which enables foreach-like usage:
 *   gen | [](Value v) -> void {...};
 */
template <class Value, class Gen, class Handler>
typename std::enable_if<
    IsCompatibleSignature<Handler, void(Value)>::value>::type
operator|(const GenImpl<Value, Gen>& gen, Handler&& handler) {
  static_assert(
      !Gen::infinite, "Cannot pull all values from an infinite sequence.");
  gen.self().foreach(std::forward<Handler>(handler));
}

/**
 * operator|() which enables foreach-like usage with 'break' support:
 *   gen | [](Value v) -> bool { return shouldContinue(); };
 */
template <class Value, class Gen, class Handler>
typename std::
    enable_if<IsCompatibleSignature<Handler, bool(Value)>::value, bool>::type
    operator|(const GenImpl<Value, Gen>& gen, Handler&& handler) {
  return gen.self().apply(std::forward<Handler>(handler));
}

/**
 * operator|() for composing generators with operators, similar to boosts' range
 * adaptors:
 *   gen | map(square) | sum
 */
template <class Value, class Gen, class Op>
auto operator|(const GenImpl<Value, Gen>& gen, const Operator<Op>& op)
    -> decltype(op.self().compose(gen.self())) {
  return op.self().compose(gen.self());
}

template <class Value, class Gen, class Op>
auto operator|(GenImpl<Value, Gen>&& gen, const Operator<Op>& op)
    -> decltype(op.self().compose(std::move(gen.self()))) {
  return op.self().compose(std::move(gen.self()));
}

namespace detail {

/**
 * Composed - For building up a pipeline of operations to perform, absent any
 * particular source generator. Useful for building up custom pipelines.
 *
 * This type is usually used by just piping two operators together:
 *
 * auto valuesOf = filter([](Optional<int>& o) { return o.hasValue(); })
 *               | map([](Optional<int>& o) -> int& { return o.value(); });
 *
 *  auto valuesIncluded = from(optionals) | valuesOf | as<vector>();
 */
template <class First, class Second>
class Composed : public Operator<Composed<First, Second>> {
  First first_;
  Second second_;

 public:
  Composed() = default;

  Composed(First first, Second second)
      : first_(std::move(first)), second_(std::move(second)) {}

  template <
      class Source,
      class Value,
      class FirstRet =
          decltype(std::declval<First>().compose(std::declval<Source>())),
      class SecondRet =
          decltype(std::declval<Second>().compose(std::declval<FirstRet>()))>
  SecondRet compose(const GenImpl<Value, Source>& source) const {
    return second_.compose(first_.compose(source.self()));
  }

  template <
      class Source,
      class Value,
      class FirstRet =
          decltype(std::declval<First>().compose(std::declval<Source>())),
      class SecondRet =
          decltype(std::declval<Second>().compose(std::declval<FirstRet>()))>
  SecondRet compose(GenImpl<Value, Source>&& source) const {
    return second_.compose(first_.compose(std::move(source.self())));
  }
};

/**
 * Chain - For concatenating the values produced by two Generators.
 *
 * This type is primarily used through using '+' to combine generators, like:
 *
 *   auto nums = seq(1, 10) + seq(20, 30);
 *   int total = nums | sum;
 */
template <class Value, class First, class Second>
class Chain : public GenImpl<Value, Chain<Value, First, Second>> {
  First first_;
  Second second_;

 public:
  explicit Chain(First first, Second second)
      : first_(std::move(first)), second_(std::move(second)) {}

  template <class Handler>
  bool apply(Handler&& handler) const {
    return first_.apply(std::forward<Handler>(handler)) &&
        second_.apply(std::forward<Handler>(handler));
  }

  template <class Body>
  void foreach(Body&& body) const {
    first_.foreach(std::forward<Body>(body));
    second_.foreach(std::forward<Body>(body));
  }

  static constexpr bool infinite = First::infinite || Second::infinite;
};

} // namespace detail
} // namespace gen
} // namespace folly

FOLLY_POP_WARNING
