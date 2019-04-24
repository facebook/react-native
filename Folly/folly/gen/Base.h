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

#pragma once
#define FOLLY_GEN_BASE_H_

#include <algorithm>
#include <functional>
#include <memory>
#include <random>
#include <type_traits>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

#include <folly/Conv.h>
#include <folly/Optional.h>
#include <folly/Range.h>
#include <folly/Utility.h>
#include <folly/gen/Core.h>

/**
 * Generator-based Sequence Comprehensions in C++, akin to C#'s LINQ
 * @author Tom Jackson <tjackson@fb.com>
 *
 * This library makes it possible to write declarative comprehensions for
 * processing sequences of values efficiently in C++. The operators should be
 * familiar to those with experience in functional programming, and the
 * performance will be virtually identical to the equivalent, boilerplate C++
 * implementations.
 *
 * Generator objects may be created from either an stl-like container (anything
 * supporting begin() and end()), from sequences of values, or from another
 * generator (see below). To create a generator that pulls values from a vector,
 * for example, one could write:
 *
 *   vector<string> names { "Jack", "Jill", "Sara", "Tom" };
 *   auto gen = from(names);
 *
 * Generators are composed by building new generators out of old ones through
 * the use of operators. These are reminicent of shell pipelines, and afford
 * similar composition. Lambda functions are used liberally to describe how to
 * handle individual values:
 *
 *   auto lengths = gen
 *                | mapped([](const fbstring& name) { return name.size(); });
 *
 * Generators are lazy; they don't actually perform any work until they need to.
 * As an example, the 'lengths' generator (above) won't actually invoke the
 * provided lambda until values are needed:
 *
 *   auto lengthVector = lengths | as<std::vector>();
 *   auto totalLength = lengths | sum;
 *
 * 'auto' is useful in here because the actual types of the generators objects
 * are usually complicated and implementation-sensitive.
 *
 * If a simpler type is desired (for returning, as an example), VirtualGen<T>
 * may be used to wrap the generator in a polymorphic wrapper:
 *
 *  VirtualGen<float> powersOfE() {
 *    return seq(1) | mapped(&expf);
 *  }
 *
 * To learn more about this library, including the use of infinite generators,
 * see the examples in the comments, or the docs (coming soon).
 */

namespace folly {
namespace gen {

class Less {
 public:
  template <class First, class Second>
  auto operator()(const First& first, const Second& second) const
      -> decltype(first < second) {
    return first < second;
  }
};

class Greater {
 public:
  template <class First, class Second>
  auto operator()(const First& first, const Second& second) const
      -> decltype(first > second) {
    return first > second;
  }
};

template <int n>
class Get {
 public:
  template <class Value>
  auto operator()(Value&& value) const
      -> decltype(std::get<n>(std::forward<Value>(value))) {
    return std::get<n>(std::forward<Value>(value));
  }
};

template <class Class, class Result>
class MemberFunction {
 public:
  typedef Result (Class::*MemberPtr)();

 private:
  MemberPtr member_;

 public:
  explicit MemberFunction(MemberPtr member) : member_(member) {}

  Result operator()(Class&& x) const {
    return (x.*member_)();
  }

  Result operator()(Class& x) const {
    return (x.*member_)();
  }

  Result operator()(Class* x) const {
    return (x->*member_)();
  }
};

template <class Class, class Result>
class ConstMemberFunction {
 public:
  typedef Result (Class::*MemberPtr)() const;

 private:
  MemberPtr member_;

 public:
  explicit ConstMemberFunction(MemberPtr member) : member_(member) {}

  Result operator()(const Class& x) const {
    return (x.*member_)();
  }

  Result operator()(const Class* x) const {
    return (x->*member_)();
  }
};

template <class Class, class FieldType>
class Field {
 public:
  typedef FieldType(Class::*FieldPtr);

 private:
  FieldPtr field_;

 public:
  explicit Field(FieldPtr field) : field_(field) {}

  const FieldType& operator()(const Class& x) const {
    return x.*field_;
  }

  const FieldType& operator()(const Class* x) const {
    return x->*field_;
  }

  FieldType& operator()(Class& x) const {
    return x.*field_;
  }

  FieldType& operator()(Class* x) const {
    return x->*field_;
  }

  FieldType&& operator()(Class&& x) const {
    return std::move(x.*field_);
  }
};

class Move {
 public:
  template <class Value>
  auto operator()(Value&& value) const
      -> decltype(std::move(std::forward<Value>(value))) {
    return std::move(std::forward<Value>(value));
  }
};

/**
 * Class and helper function for negating a boolean Predicate
 */
template <class Predicate>
class Negate {
  Predicate pred_;

 public:
  Negate() = default;

  explicit Negate(Predicate pred) : pred_(std::move(pred)) {}

  template <class Arg>
  bool operator()(Arg&& arg) const {
    return !pred_(std::forward<Arg>(arg));
  }
};
template <class Predicate>
Negate<Predicate> negate(Predicate pred) {
  return Negate<Predicate>(std::move(pred));
}

template <class Dest>
class Cast {
 public:
  template <class Value>
  Dest operator()(Value&& value) const {
    return Dest(std::forward<Value>(value));
  }
};

template <class Dest>
class To {
 public:
  template <class Value>
  Dest operator()(Value&& value) const {
    return ::folly::to<Dest>(std::forward<Value>(value));
  }
};

template <class Dest>
class TryTo {
 public:
  template <class Value>
  Expected<Dest, ConversionCode> operator()(Value&& value) const {
    return ::folly::tryTo<Dest>(std::forward<Value>(value));
  }
};

// Specialization to allow String->StringPiece conversion
template <>
class To<StringPiece> {
 public:
  StringPiece operator()(StringPiece src) const {
    return src;
  }
};

template <class Key, class Value>
class Group;

namespace detail {

template <class Self>
struct FBounded;

/*
 * Type Traits
 */
template <class Container>
struct ValueTypeOfRange {
 public:
  using RefType = decltype(*std::begin(std::declval<Container&>()));
  using StorageType = typename std::decay<RefType>::type;
};

/*
 * Sources
 */
template <
    class Container,
    class Value = typename ValueTypeOfRange<Container>::RefType>
class ReferencedSource;

template <
    class Value,
    class Container = std::vector<typename std::decay<Value>::type>>
class CopiedSource;

template <class Value, class SequenceImpl>
class Sequence;

template <class Value>
class RangeImpl;

template <class Value, class Distance>
class RangeWithStepImpl;

template <class Value>
class SeqImpl;

template <class Value, class Distance>
class SeqWithStepImpl;

template <class Value>
class InfiniteImpl;

template <class Value, class Source>
class Yield;

template <class Value>
class Empty;

template <class Value>
class SingleReference;

template <class Value>
class SingleCopy;

/*
 * Operators
 */
template <class Predicate>
class Map;

template <class Predicate>
class Filter;

template <class Predicate>
class Until;

class Take;

class Stride;

template <class Rand>
class Sample;

class Skip;

template <class Visitor>
class Visit;

template <class Selector, class Comparer = Less>
class Order;

template <class Selector>
class GroupBy;

template <class Selector>
class GroupByAdjacent;

template <class Selector>
class Distinct;

template <class Operators>
class Composer;

template <class Expected>
class TypeAssertion;

class Concat;

class RangeConcat;

template <bool forever>
class Cycle;

class Batch;

class Window;

class Dereference;

class Indirect;

/*
 * Sinks
 */
template <class Seed, class Fold>
class FoldLeft;

class First;

template <bool result>
class IsEmpty;

template <class Reducer>
class Reduce;

class Sum;

template <class Selector, class Comparer>
class Min;

template <class Container>
class Collect;

template <
    template <class, class> class Collection = std::vector,
    template <class> class Allocator = std::allocator>
class CollectTemplate;

template <class Collection>
class Append;

template <class Value>
struct GeneratorBuilder;

template <class Needle>
class Contains;

template <class Exception, class ErrorHandler>
class GuardImpl;

template <class T>
class UnwrapOr;

class Unwrap;

} // namespace detail

/**
 * Polymorphic wrapper
 **/
template <class Value>
class VirtualGen;

/*
 * Source Factories
 */
template <
    class Container,
    class From = detail::ReferencedSource<const Container>>
From fromConst(const Container& source) {
  return From(&source);
}

template <class Container, class From = detail::ReferencedSource<Container>>
From from(Container& source) {
  return From(&source);
}

template <
    class Container,
    class Value = typename detail::ValueTypeOfRange<Container>::StorageType,
    class CopyOf = detail::CopiedSource<Value>>
CopyOf fromCopy(Container&& source) {
  return CopyOf(std::forward<Container>(source));
}

template <class Value, class From = detail::CopiedSource<Value>>
From from(std::initializer_list<Value> source) {
  return From(source);
}

template <
    class Container,
    class From =
        detail::CopiedSource<typename Container::value_type, Container>>
From from(Container&& source) {
  return From(std::move(source));
}

template <
    class Value,
    class Impl = detail::RangeImpl<Value>,
    class Gen = detail::Sequence<Value, Impl>>
Gen range(Value begin, Value end) {
  return Gen{std::move(begin), Impl{std::move(end)}};
}

template <
    class Value,
    class Distance,
    class Impl = detail::RangeWithStepImpl<Value, Distance>,
    class Gen = detail::Sequence<Value, Impl>>
Gen range(Value begin, Value end, Distance step) {
  return Gen{std::move(begin), Impl{std::move(end), std::move(step)}};
}

template <
    class Value,
    class Impl = detail::SeqImpl<Value>,
    class Gen = detail::Sequence<Value, Impl>>
Gen seq(Value first, Value last) {
  return Gen{std::move(first), Impl{std::move(last)}};
}

template <
    class Value,
    class Distance,
    class Impl = detail::SeqWithStepImpl<Value, Distance>,
    class Gen = detail::Sequence<Value, Impl>>
Gen seq(Value first, Value last, Distance step) {
  return Gen{std::move(first), Impl{std::move(last), std::move(step)}};
}

template <
    class Value,
    class Impl = detail::InfiniteImpl<Value>,
    class Gen = detail::Sequence<Value, Impl>>
Gen seq(Value first) {
  return Gen{std::move(first), Impl{}};
}

template <class Value, class Source, class Yield = detail::Yield<Value, Source>>
Yield generator(Source&& source) {
  return Yield(std::forward<Source>(source));
}

/*
 * Create inline generator, used like:
 *
 *  auto gen = GENERATOR(int) { yield(1); yield(2); };
 */
#define GENERATOR(TYPE) \
  ::folly::gen::detail::GeneratorBuilder<TYPE>() + [=](auto&& yield)

/*
 * empty() - for producing empty sequences.
 */
template <class Value>
detail::Empty<Value> empty() {
  return {};
}

template <
    class Value,
    class Just = typename std::conditional<
        std::is_reference<Value>::value,
        detail::SingleReference<typename std::remove_reference<Value>::type>,
        detail::SingleCopy<Value>>::type>
Just just(Value&& value) {
  return Just(std::forward<Value>(value));
}

/*
 * Operator Factories
 */
template <class Predicate, class Map = detail::Map<Predicate>>
Map mapped(Predicate pred = Predicate()) {
  return Map(std::move(pred));
}

template <class Predicate, class Map = detail::Map<Predicate>>
Map map(Predicate pred = Predicate()) {
  return Map(std::move(pred));
}

/**
 * mapOp - Given a generator of generators, maps the application of the given
 * operator on to each inner gen. Especially useful in aggregating nested data
 * structures:
 *
 *   chunked(samples, 256)
 *     | mapOp(filter(sampleTest) | count)
 *     | sum;
 */
template <class Operator, class Map = detail::Map<detail::Composer<Operator>>>
Map mapOp(Operator op) {
  return Map(detail::Composer<Operator>(std::move(op)));
}

/*
 * member(...) - For extracting a member from each value.
 *
 *  vector<string> strings = ...;
 *  auto sizes = from(strings) | member(&string::size);
 *
 * If a member is const overridden (like 'front()'), pass template parameter
 * 'Const' to select the const version, or 'Mutable' to select the non-const
 * version:
 *
 *  auto heads = from(strings) | member<Const>(&string::front);
 */
enum MemberType {
  Const,
  Mutable,
};

/**
 * These exist because MSVC has problems with expression SFINAE in templates
 * assignment and comparisons don't work properly without being pulled out
 * of the template declaration
 */
template <MemberType Constness>
struct ExprIsConst {
  enum {
    value = Constness == Const,
  };
};

template <MemberType Constness>
struct ExprIsMutable {
  enum {
    value = Constness == Mutable,
  };
};

template <
    MemberType Constness = Const,
    class Class,
    class Return,
    class Mem = ConstMemberFunction<Class, Return>,
    class Map = detail::Map<Mem>>
typename std::enable_if<ExprIsConst<Constness>::value, Map>::type member(
    Return (Class::*member)() const) {
  return Map(Mem(member));
}

template <
    MemberType Constness = Mutable,
    class Class,
    class Return,
    class Mem = MemberFunction<Class, Return>,
    class Map = detail::Map<Mem>>
typename std::enable_if<ExprIsMutable<Constness>::value, Map>::type member(
    Return (Class::*member)()) {
  return Map(Mem(member));
}

/*
 * field(...) - For extracting a field from each value.
 *
 *  vector<Item> items = ...;
 *  auto names = from(items) | field(&Item::name);
 *
 * Note that if the values of the generator are rvalues, any non-reference
 * fields will be rvalues as well. As an example, the code below does not copy
 * any strings, only moves them:
 *
 *  auto namesVector = from(items)
 *                   | move
 *                   | field(&Item::name)
 *                   | as<vector>();
 */
template <
    class Class,
    class FieldType,
    class Field = Field<Class, FieldType>,
    class Map = detail::Map<Field>>
Map field(FieldType Class::*field) {
  return Map(Field(field));
}

template <class Predicate = Identity, class Filter = detail::Filter<Predicate>>
Filter filter(Predicate pred = Predicate()) {
  return Filter(std::move(pred));
}

template <class Visitor = Ignore, class Visit = detail::Visit<Visitor>>
Visit visit(Visitor visitor = Visitor()) {
  return Visit(std::move(visitor));
}

template <class Predicate = Identity, class Until = detail::Until<Predicate>>
Until until(Predicate pred = Predicate()) {
  return Until(std::move(pred));
}

template <
    class Predicate = Identity,
    class TakeWhile = detail::Until<Negate<Predicate>>>
TakeWhile takeWhile(Predicate pred = Predicate()) {
  return TakeWhile(Negate<Predicate>(std::move(pred)));
}

template <
    class Selector = Identity,
    class Comparer = Less,
    class Order = detail::Order<Selector, Comparer>>
Order orderBy(Selector selector = Selector(), Comparer comparer = Comparer()) {
  return Order(std::move(selector), std::move(comparer));
}

template <
    class Selector = Identity,
    class Order = detail::Order<Selector, Greater>>
Order orderByDescending(Selector selector = Selector()) {
  return Order(std::move(selector));
}

template <class Selector = Identity, class GroupBy = detail::GroupBy<Selector>>
GroupBy groupBy(Selector selector = Selector()) {
  return GroupBy(std::move(selector));
}

template <
    class Selector = Identity,
    class GroupByAdjacent = detail::GroupByAdjacent<Selector>>
GroupByAdjacent groupByAdjacent(Selector selector = Selector()) {
  return GroupByAdjacent(std::move(selector));
}

template <
    class Selector = Identity,
    class Distinct = detail::Distinct<Selector>>
Distinct distinctBy(Selector selector = Selector()) {
  return Distinct(std::move(selector));
}

template <int n, class Get = detail::Map<Get<n>>>
Get get() {
  return Get();
}

// construct Dest from each value
template <class Dest, class Cast = detail::Map<Cast<Dest>>>
Cast eachAs() {
  return Cast();
}

// call folly::to on each value
template <class Dest, class EachTo = detail::Map<To<Dest>>>
EachTo eachTo() {
  return EachTo();
}

// call folly::tryTo on each value
template <class Dest, class EachTryTo = detail::Map<TryTo<Dest>>>
EachTryTo eachTryTo() {
  return EachTryTo();
}

template <class Value>
detail::TypeAssertion<Value> assert_type() {
  return {};
}

/*
 * Sink Factories
 */

/**
 * any() - For determining if any value in a sequence satisfies a predicate.
 *
 * The following is an example for checking if any computer is broken:
 *
 *   bool schrepIsMad = from(computers) | any(isBroken);
 *
 * (because everyone knows Schrep hates broken computers).
 *
 * Note that if no predicate is provided, 'any()' checks if any of the values
 * are true when cased to bool. To check if any of the scores are nonZero:
 *
 *   bool somebodyScored = from(scores) | any();
 *
 * Note: Passing an empty sequence through 'any()' will always return false. In
 * fact, 'any()' is equivilent to the composition of 'filter()' and 'notEmpty'.
 *
 *   from(source) | any(pred) == from(source) | filter(pred) | notEmpty
 */

template <
    class Predicate = Identity,
    class Filter = detail::Filter<Predicate>,
    class NotEmpty = detail::IsEmpty<false>,
    class Composed = detail::Composed<Filter, NotEmpty>>
Composed any(Predicate pred = Predicate()) {
  return Composed(Filter(std::move(pred)), NotEmpty());
}

/**
 * all() - For determining whether all values in a sequence satisfy a predicate.
 *
 * The following is an example for checking if all members of a team are cool:
 *
 *   bool isAwesomeTeam = from(team) | all(isCool);
 *
 * Note that if no predicate is provided, 'all()'' checks if all of the values
 * are true when cased to bool.
 * The following makes sure none of 'pointers' are nullptr:
 *
 *   bool allNonNull = from(pointers) | all();
 *
 * Note: Passing an empty sequence through 'all()' will always return true. In
 * fact, 'all()' is equivilent to the composition of 'filter()' with the
 * reversed predicate and 'isEmpty'.
 *
 *   from(source) | all(pred) == from(source) | filter(negate(pred)) | isEmpty
 */
template <
    class Predicate = Identity,
    class Filter = detail::Filter<Negate<Predicate>>,
    class IsEmpty = detail::IsEmpty<true>,
    class Composed = detail::Composed<Filter, IsEmpty>>
Composed all(Predicate pred = Predicate()) {
  return Composed(Filter(std::move(negate(pred))), IsEmpty());
}

template <class Seed, class Fold, class FoldLeft = detail::FoldLeft<Seed, Fold>>
FoldLeft foldl(Seed seed = Seed(), Fold fold = Fold()) {
  return FoldLeft(std::move(seed), std::move(fold));
}

template <class Reducer, class Reduce = detail::Reduce<Reducer>>
Reduce reduce(Reducer reducer = Reducer()) {
  return Reduce(std::move(reducer));
}

template <class Selector = Identity, class Min = detail::Min<Selector, Less>>
Min minBy(Selector selector = Selector()) {
  return Min(std::move(selector));
}

template <class Selector, class MaxBy = detail::Min<Selector, Greater>>
MaxBy maxBy(Selector selector = Selector()) {
  return MaxBy(std::move(selector));
}

template <class Collection, class Collect = detail::Collect<Collection>>
Collect as() {
  return Collect();
}

template <
    template <class, class> class Container = std::vector,
    template <class> class Allocator = std::allocator,
    class Collect = detail::CollectTemplate<Container, Allocator>>
Collect as() {
  return Collect();
}

template <class Collection, class Append = detail::Append<Collection>>
Append appendTo(Collection& collection) {
  return Append(&collection);
}

template <
    class Needle,
    class Contains = detail::Contains<typename std::decay<Needle>::type>>
Contains contains(Needle&& needle) {
  return Contains(std::forward<Needle>(needle));
}

template <
    class Exception,
    class ErrorHandler,
    class GuardImpl =
        detail::GuardImpl<Exception, typename std::decay<ErrorHandler>::type>>
GuardImpl guard(ErrorHandler&& handler) {
  return GuardImpl(std::forward<ErrorHandler>(handler));
}

template <
    class Fallback,
    class UnwrapOr = detail::UnwrapOr<typename std::decay<Fallback>::type>>
UnwrapOr unwrapOr(Fallback&& fallback) {
  return UnwrapOr(std::forward<Fallback>(fallback));
}

} // namespace gen
} // namespace folly

#include <folly/gen/Base-inl.h>
