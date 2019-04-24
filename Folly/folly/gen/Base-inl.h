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

#ifndef FOLLY_GEN_BASE_H_
#error This file may only be included from folly/gen/Base.h
#endif

#include <folly/Portability.h>
#include <folly/functional/Invoke.h>

// Ignore shadowing warnings within this file, so includers can use -Wshadow.
FOLLY_PUSH_WARNING
FOLLY_GNU_DISABLE_WARNING("-Wshadow")

namespace folly {
namespace gen {

/**
 * ArgumentReference - For determining ideal argument type to receive a value.
 */
template <class T>
struct ArgumentReference : public std::conditional<
                               std::is_reference<T>::value,
                               T, // T& -> T&, T&& -> T&&, const T& -> const T&
                               typename std::conditional<
                                   std::is_const<T>::value,
                                   T&, // const int -> const int&
                                   T&& // int -> int&&
                                   >::type> {};

/**
 * Group - The output objects from the GroupBy operator
 */
template <class Key, class Value>
class Group : public GenImpl<Value&&, Group<Key, Value>> {
 public:
  static_assert(
      !std::is_reference<Key>::value && !std::is_reference<Value>::value,
      "Key and Value must be decayed types");

  typedef std::vector<Value> VectorType;
  typedef Key KeyType;
  typedef Value ValueType;

  Group(Key key, VectorType values)
      : key_(std::move(key)), values_(std::move(values)) {}

  const Key& key() const {
    return key_;
  }

  size_t size() const {
    return values_.size();
  }
  const VectorType& values() const {
    return values_;
  }
  VectorType& values() {
    return values_;
  }

  VectorType operator|(const detail::Collect<VectorType>&) const {
    return values();
  }

  VectorType operator|(const detail::CollectTemplate<std::vector>&) const {
    return values();
  }

  template <class Body>
  void foreach(Body&& body) const {
    for (auto& value : values_) {
      body(std::move(value));
    }
  }

  template <class Handler>
  bool apply(Handler&& handler) const {
    for (auto& value : values_) {
      if (!handler(std::move(value))) {
        return false;
      }
    }
    return true;
  }

  // GroupBy only takes in finite generators, so we only have finite groups
  static constexpr bool infinite = false;

 private:
  Key key_;
  mutable VectorType values_;
};

namespace detail {

// Classes used for the implementation of Sources, Operators, and Sinks

/*
 ******************************* Sources ***************************************
 */

/*
 * ReferencedSource - Generate values from an STL-like container using
 * iterators from .begin() until .end(). Value type defaults to the type of
 * *container->begin(). For std::vector<int>, this would be int&. Note that the
 * value here is a reference, so the values in the vector will be passed by
 * reference to downstream operators.
 *
 * This type is primarily used through the 'from' helper method, like:
 *
 *   string& longestName = from(names)
 *                       | maxBy([](string& s) { return s.size() });
 */
template <class Container, class Value>
class ReferencedSource
    : public GenImpl<Value, ReferencedSource<Container, Value>> {
  Container* container_;

 public:
  explicit ReferencedSource(Container* container) : container_(container) {}

  template <class Body>
  void foreach(Body&& body) const {
    for (auto& value : *container_) {
      body(std::forward<Value>(value));
    }
  }

  template <class Handler>
  bool apply(Handler&& handler) const {
    for (auto& value : *container_) {
      if (!handler(std::forward<Value>(value))) {
        return false;
      }
    }
    return true;
  }

  // from takes in a normal stl structure, which are all finite
  static constexpr bool infinite = false;
};

/**
 * CopiedSource - For producing values from eagerly from a sequence of values
 * whose storage is owned by this class. Useful for preparing a generator for
 * use after a source collection will no longer be available, or for when the
 * values are specified literally with an initializer list.
 *
 * This type is primarily used through the 'fromCopy' function, like:
 *
 *   auto sourceCopy = fromCopy(makeAVector());
 *   auto sum = sourceCopy | sum;
 *   auto max = sourceCopy | max;
 *
 * Though it is also used for the initializer_list specialization of from().
 */
template <class StorageType, class Container>
class CopiedSource
    : public GenImpl<const StorageType&, CopiedSource<StorageType, Container>> {
  static_assert(
      !std::is_reference<StorageType>::value,
      "StorageType must be decayed");

 public:
  // Generator objects are often copied during normal construction as they are
  // encapsulated by downstream generators. It would be bad if this caused
  // a copy of the entire container each time, and since we're only exposing a
  // const reference to the value, it's safe to share it between multiple
  // generators.
  static_assert(
      !std::is_reference<Container>::value,
      "Can't copy into a reference");
  std::shared_ptr<const Container> copy_;

 public:
  typedef Container ContainerType;

  template <class SourceContainer>
  explicit CopiedSource(const SourceContainer& container)
      : copy_(new Container(begin(container), end(container))) {}

  explicit CopiedSource(Container&& container)
      : copy_(new Container(std::move(container))) {}

  // To enable re-use of cached results.
  CopiedSource(const CopiedSource<StorageType, Container>& source)
      : copy_(source.copy_) {}

  template <class Body>
  void foreach(Body&& body) const {
    for (const auto& value : *copy_) {
      body(value);
    }
  }

  template <class Handler>
  bool apply(Handler&& handler) const {
    // The collection may be reused by others, we can't allow it to be changed.
    for (const auto& value : *copy_) {
      if (!handler(value)) {
        return false;
      }
    }
    return true;
  }

  // from takes in a normal stl structure, which are all finite
  static constexpr bool infinite = false;
};

/**
 * RangeSource - For producing values from a folly::Range. Useful for referring
 * to a slice of some container.
 *
 * This type is primarily used through the 'from' function, like:
 *
 *   auto rangeSource = from(folly::range(v.begin(), v.end()));
 *   auto sum = rangeSource | sum;
 *
 * Reminder: Be careful not to invalidate iterators when using ranges like this.
 */
template <class Iterator>
class RangeSource : public GenImpl<
                        typename Range<Iterator>::reference,
                        RangeSource<Iterator>> {
  Range<Iterator> range_;

 public:
  RangeSource() = default;
  explicit RangeSource(Range<Iterator> range) : range_(std::move(range)) {}

  template <class Handler>
  bool apply(Handler&& handler) const {
    for (auto& value : range_) {
      if (!handler(value)) {
        return false;
      }
    }
    return true;
  }

  template <class Body>
  void foreach(Body&& body) const {
    for (auto& value : range_) {
      body(value);
    }
  }

  // folly::Range only supports finite ranges
  static constexpr bool infinite = false;
};

/**
 * Sequence - For generating values from beginning value, incremented along the
 * way with the ++ and += operators. Iteration may continue indefinitely.
 * Value type specified explicitly.
 *
 * This type is primarily used through the 'seq' and 'range' function, like:
 *
 *   int total = seq(1, 10) | sum;
 *   auto indexes = range(0, 10);
 *   auto endless = seq(0); // 0, 1, 2, 3, ...
 */
template <class Value, class SequenceImpl>
class Sequence : public GenImpl<const Value&, Sequence<Value, SequenceImpl>> {
  static_assert(
      !std::is_reference<Value>::value && !std::is_const<Value>::value,
      "Value mustn't be const or ref.");
  Value start_;
  SequenceImpl impl_;

 public:
  explicit Sequence(Value start, SequenceImpl impl)
      : start_(std::move(start)), impl_(std::move(impl)) {}

  template <class Handler>
  bool apply(Handler&& handler) const {
    for (Value current = start_; impl_.test(current); impl_.step(current)) {
      if (!handler(current)) {
        return false;
      }
    }
    return true;
  }

  template <class Body>
  void foreach(Body&& body) const {
    for (Value current = start_; impl_.test(current); impl_.step(current)) {
      body(current);
    }
  }

  // Let the implementation say if we are infinite or not
  static constexpr bool infinite = SequenceImpl::infinite;
};

/**
 * Sequence implementations (range, sequence, infinite, with/without step)
 **/
template <class Value>
class RangeImpl {
  Value end_;

 public:
  explicit RangeImpl(Value end) : end_(std::move(end)) {}
  bool test(const Value& current) const {
    return current < end_;
  }
  void step(Value& current) const {
    ++current;
  }
  static constexpr bool infinite = false;
};

template <class Value, class Distance>
class RangeWithStepImpl {
  Value end_;
  Distance step_;

 public:
  explicit RangeWithStepImpl(Value end, Distance step)
      : end_(std::move(end)), step_(std::move(step)) {}
  bool test(const Value& current) const {
    return current < end_;
  }
  void step(Value& current) const {
    current += step_;
  }
  static constexpr bool infinite = false;
};

template <class Value>
class SeqImpl {
  Value end_;

 public:
  explicit SeqImpl(Value end) : end_(std::move(end)) {}
  bool test(const Value& current) const {
    return current <= end_;
  }
  void step(Value& current) const {
    ++current;
  }
  static constexpr bool infinite = false;
};

template <class Value, class Distance>
class SeqWithStepImpl {
  Value end_;
  Distance step_;

 public:
  explicit SeqWithStepImpl(Value end, Distance step)
      : end_(std::move(end)), step_(std::move(step)) {}
  bool test(const Value& current) const {
    return current <= end_;
  }
  void step(Value& current) const {
    current += step_;
  }
  static constexpr bool infinite = false;
};

template <class Value>
class InfiniteImpl {
 public:
  bool test(const Value& /* current */) const {
    return true;
  }
  void step(Value& current) const {
    ++current;
  }
  static constexpr bool infinite = true;
};

/**
 * GenratorBuilder - Helper for GENERTATOR macro.
 **/
template <class Value>
struct GeneratorBuilder {
  template <class Source, class Yield = detail::Yield<Value, Source>>
  Yield operator+(Source&& source) {
    return Yield(std::forward<Source>(source));
  }
};

/**
 * Yield - For producing values from a user-defined generator by way of a
 * 'yield' function.
 **/
template <class Value, class Source>
class Yield : public GenImpl<Value, Yield<Value, Source>> {
  Source source_;

 public:
  explicit Yield(Source source) : source_(std::move(source)) {}

  template <class Handler>
  bool apply(Handler&& handler) const {
    struct Break {};
    auto body = [&](Value value) {
      if (!handler(std::forward<Value>(value))) {
        throw Break();
      }
    };
    try {
      source_(body);
      return true;
    } catch (Break&) {
      return false;
    }
  }

  template <class Body>
  void foreach(Body&& body) const {
    source_(std::forward<Body>(body));
  }
};

template <class Value>
class Empty : public GenImpl<Value, Empty<Value>> {
 public:
  template <class Handler>
  bool apply(Handler&&) const {
    return true;
  }

  template <class Body>
  void foreach(Body&&) const {}

  // No values, so finite
  static constexpr bool infinite = false;
};

template <class Value>
class SingleReference : public GenImpl<Value&, SingleReference<Value>> {
  static_assert(
      !std::is_reference<Value>::value,
      "SingleReference requires non-ref types");
  Value* ptr_;

 public:
  explicit SingleReference(Value& ref) : ptr_(&ref) {}

  template <class Handler>
  bool apply(Handler&& handler) const {
    return handler(*ptr_);
  }

  template <class Body>
  void foreach(Body&& body) const {
    body(*ptr_);
  }

  // One value, so finite
  static constexpr bool infinite = false;
};

template <class Value>
class SingleCopy : public GenImpl<const Value&, SingleCopy<Value>> {
  static_assert(
      !std::is_reference<Value>::value,
      "SingleCopy requires non-ref types");
  Value value_;

 public:
  explicit SingleCopy(Value value) : value_(std::forward<Value>(value)) {}

  template <class Handler>
  bool apply(Handler&& handler) const {
    return handler(value_);
  }

  template <class Body>
  void foreach(Body&& body) const {
    body(value_);
  }

  // One value, so finite
  static constexpr bool infinite = false;
};

/*
 ***************************** Operators ***************************************
 */

/**
 * Map - For producing a sequence of values by passing each value from a source
 * collection through a predicate.
 *
 * This type is usually used through the 'map' or 'mapped' helper function:
 *
 *   auto squares = seq(1, 10) | map(square) | as<std::vector>();
 */
template <class Predicate>
class Map : public Operator<Map<Predicate>> {
  Predicate pred_;

 public:
  Map() = default;

  explicit Map(Predicate pred) : pred_(std::move(pred)) {}

  template <
      class Value,
      class Source,
      class Result =
          typename ArgumentReference<invoke_result_t<Predicate, Value>>::type>
  class Generator : public GenImpl<Result, Generator<Value, Source, Result>> {
    Source source_;
    Predicate pred_;

   public:
    explicit Generator(Source source, const Predicate& pred)
        : source_(std::move(source)), pred_(pred) {}

    template <class Body>
    void foreach(Body&& body) const {
      source_.foreach(
          [&](Value value) { body(pred_(std::forward<Value>(value))); });
    }

    template <class Handler>
    bool apply(Handler&& handler) const {
      return source_.apply([&](Value value) {
        return handler(pred_(std::forward<Value>(value)));
      });
    }

    static constexpr bool infinite = Source::infinite;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), pred_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), pred_);
  }
};

/**
 * Filter - For filtering values from a source sequence by a predicate.
 *
 * This type is usually used through the 'filter' helper function, like:
 *
 *   auto nonEmpty = from(strings)
 *                 | filter([](const string& str) -> bool {
 *                     return !str.empty();
 *                   });
 *
 * Note that if no predicate is provided, the values are casted to bool and
 * filtered based on that. So if pointers is a vector of pointers,
 *
 *   auto nonNull = from(pointers) | filter();
 *
 * will give a vector of all the pointers != nullptr.
 */
template <class Predicate>
class Filter : public Operator<Filter<Predicate>> {
  Predicate pred_;

 public:
  Filter() = default;
  explicit Filter(Predicate pred) : pred_(std::move(pred)) {}

  template <class Value, class Source>
  class Generator : public GenImpl<Value, Generator<Value, Source>> {
    Source source_;
    Predicate pred_;

   public:
    explicit Generator(Source source, const Predicate& pred)
        : source_(std::move(source)), pred_(pred) {}

    template <class Body>
    void foreach(Body&& body) const {
      source_.foreach([&](Value value) {
        // NB: Argument not forwarded to avoid accidental move-construction
        if (pred_(value)) {
          body(std::forward<Value>(value));
        }
      });
    }

    template <class Handler>
    bool apply(Handler&& handler) const {
      return source_.apply([&](Value value) -> bool {
        // NB: Argument not forwarded to avoid accidental move-construction
        if (pred_(value)) {
          return handler(std::forward<Value>(value));
        }
        return true;
      });
    }

    static constexpr bool infinite = Source::infinite;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), pred_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), pred_);
  }
};

/**
 * Until - For producing values from a source until a predicate is satisfied.
 *
 * This type is usually used through the 'until' helper function, like:
 *
 *   auto best = from(sortedItems)
 *             | until([](Item& item) { return item.score > 100; })
 *             | as<std::vector>();
 */
template <class Predicate>
class Until : public Operator<Until<Predicate>> {
  Predicate pred_;

 public:
  Until() = default;
  explicit Until(Predicate pred) : pred_(std::move(pred)) {}

  template <class Value, class Source>
  class Generator : public GenImpl<Value, Generator<Value, Source>> {
    Source source_;
    Predicate pred_;

   public:
    explicit Generator(Source source, const Predicate& pred)
        : source_(std::move(source)), pred_(pred) {}

    template <class Handler>
    bool apply(Handler&& handler) const {
      bool cancelled = false;
      source_.apply([&](Value value) -> bool {
        if (pred_(value)) { // un-forwarded to disable move
          return false;
        }
        if (!handler(std::forward<Value>(value))) {
          cancelled = true;
          return false;
        }
        return true;
      });
      return !cancelled;
    }

    // Theoretically an 'until' might stop an infinite
    static constexpr bool infinite = false;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), pred_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), pred_);
  }
};

/**
 * Take - For producing up to N values from a source.
 *
 * This type is usually used through the 'take' helper function, like:
 *
 *   auto best = from(docs)
 *             | orderByDescending(scoreDoc)
 *             | take(10);
 */
class Take : public Operator<Take> {
  size_t count_;

 public:
  explicit Take(size_t count) : count_(count) {}

  template <class Value, class Source>
  class Generator : public GenImpl<Value, Generator<Value, Source>> {
    Source source_;
    size_t count_;

   public:
    explicit Generator(Source source, size_t count)
        : source_(std::move(source)), count_(count) {}

    template <class Handler>
    bool apply(Handler&& handler) const {
      if (count_ == 0) {
        return false;
      }
      size_t n = count_;
      bool cancelled = false;
      source_.apply([&](Value value) -> bool {
        if (!handler(std::forward<Value>(value))) {
          cancelled = true;
          return false;
        }
        return --n;
      });
      return !cancelled;
    }

    // take will stop an infinite generator
    static constexpr bool infinite = false;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), count_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), count_);
  }
};

/**
 * Visit - For calling a function on each item before passing it down the
 * pipeline.
 *
 * This type is usually used through the 'visit' helper function:
 *
 *   auto printedValues = seq(1) | visit(debugPrint);
 *   // nothing printed yet
 *   auto results = take(10) | as<std::vector>();
 *   // results now populated, 10 values printed
 */
template <class Visitor>
class Visit : public Operator<Visit<Visitor>> {
  Visitor visitor_;

 public:
  Visit() = default;

  explicit Visit(Visitor visitor) : visitor_(std::move(visitor)) {}

  template <class Value, class Source>
  class Generator : public GenImpl<Value, Generator<Value, Source>> {
    Source source_;
    Visitor visitor_;

   public:
    explicit Generator(Source source, const Visitor& visitor)
        : source_(std::move(source)), visitor_(visitor) {}

    template <class Body>
    void foreach(Body&& body) const {
      source_.foreach([&](Value value) {
        visitor_(value); // not forwarding to avoid accidental moves
        body(std::forward<Value>(value));
      });
    }

    template <class Handler>
    bool apply(Handler&& handler) const {
      return source_.apply([&](Value value) {
        visitor_(value); // not forwarding to avoid accidental moves
        return handler(std::forward<Value>(value));
      });
    }

    static constexpr bool infinite = Source::infinite;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), visitor_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), visitor_);
  }
};

/**
 * Stride - For producing every Nth value from a source.
 *
 * This type is usually used through the 'stride' helper function, like:
 *
 *   auto half = from(samples)
 *             | stride(2);
 */
class Stride : public Operator<Stride> {
  size_t stride_;

 public:
  explicit Stride(size_t stride) : stride_(stride) {
    if (stride == 0) {
      throw std::invalid_argument("stride must not be 0");
    }
  }

  template <class Value, class Source>
  class Generator : public GenImpl<Value, Generator<Value, Source>> {
    Source source_;
    size_t stride_;

   public:
    explicit Generator(Source source, size_t stride)
        : source_(std::move(source)), stride_(stride) {}

    template <class Handler>
    bool apply(Handler&& handler) const {
      size_t distance = stride_;
      return source_.apply([&](Value value) -> bool {
        if (++distance >= stride_) {
          if (!handler(std::forward<Value>(value))) {
            return false;
          }
          distance = 0;
        }
        return true;
      });
    }

    template <class Body>
    void foreach(Body&& body) const {
      size_t distance = stride_;
      source_.foreach([&](Value value) {
        if (++distance >= stride_) {
          body(std::forward<Value>(value));
          distance = 0;
        }
      });
    }

    // Taking every Nth of an infinite list is still infinte
    static constexpr bool infinite = Source::infinite;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), stride_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), stride_);
  }
};

/**
 * Sample - For taking a random sample of N elements from a sequence
 * (without replacement).
 */
template <class Random>
class Sample : public Operator<Sample<Random>> {
  size_t count_;
  Random rng_;

 public:
  explicit Sample(size_t count, Random rng)
      : count_(count), rng_(std::move(rng)) {}

  template <
      class Value,
      class Source,
      class Rand,
      class StorageType = typename std::decay<Value>::type>
  class Generator : public GenImpl<
                        StorageType&&,
                        Generator<Value, Source, Rand, StorageType>> {
    static_assert(!Source::infinite, "Cannot sample infinite source!");
    // It's too easy to bite ourselves if random generator is only 16-bit
    static_assert(
        Random::max() >= std::numeric_limits<int32_t>::max() - 1,
        "Random number generator must support big values");
    Source source_;
    size_t count_;
    mutable Rand rng_;

   public:
    explicit Generator(Source source, size_t count, Random rng)
        : source_(std::move(source)), count_(count), rng_(std::move(rng)) {}

    template <class Handler>
    bool apply(Handler&& handler) const {
      if (count_ == 0) {
        return false;
      }
      std::vector<StorageType> v;
      v.reserve(count_);
      // use reservoir sampling to give each source value an equal chance
      // of appearing in our output.
      size_t n = 1;
      source_.foreach([&](Value value) -> void {
        if (v.size() < count_) {
          v.push_back(std::forward<Value>(value));
        } else {
          // alternatively, we could create a std::uniform_int_distribution
          // instead of using modulus, but benchmarks show this has
          // substantial overhead.
          size_t index = rng_() % n;
          if (index < v.size()) {
            v[index] = std::forward<Value>(value);
          }
        }
        ++n;
      });

      // output is unsorted!
      for (auto& val : v) {
        if (!handler(std::move(val))) {
          return false;
        }
      }
      return true;
    }

    // Only takes N elements, so finite
    static constexpr bool infinite = false;
  };

  template <
      class Source,
      class Value,
      class Gen = Generator<Value, Source, Random>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), count_, rng_);
  }

  template <
      class Source,
      class Value,
      class Gen = Generator<Value, Source, Random>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), count_, rng_);
  }
};

/**
 * Skip - For skipping N items from the beginning of a source generator.
 *
 * This type is usually used through the 'skip' helper function, like:
 *
 *   auto page = from(results)
 *             | skip(pageSize * startPage)
 *             | take(10);
 */
class Skip : public Operator<Skip> {
  size_t count_;

 public:
  explicit Skip(size_t count) : count_(count) {}

  template <class Value, class Source>
  class Generator : public GenImpl<Value, Generator<Value, Source>> {
    Source source_;
    size_t count_;

   public:
    explicit Generator(Source source, size_t count)
        : source_(std::move(source)), count_(count) {}

    template <class Body>
    void foreach(Body&& body) const {
      if (count_ == 0) {
        source_.foreach(body);
        return;
      }
      size_t n = 0;
      source_.foreach([&](Value value) {
        if (n < count_) {
          ++n;
        } else {
          body(std::forward<Value>(value));
        }
      });
    }

    template <class Handler>
    bool apply(Handler&& handler) const {
      if (count_ == 0) {
        return source_.apply(std::forward<Handler>(handler));
      }
      size_t n = 0;
      return source_.apply([&](Value value) -> bool {
        if (n < count_) {
          ++n;
          return true;
        }
        return handler(std::forward<Value>(value));
      });
    }

    // Skipping N items of an infinite source is still infinite
    static constexpr bool infinite = Source::infinite;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), count_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), count_);
  }
};

/**
 * Order - For ordering a sequence of values from a source by key.
 * The key is extracted by the given selector functor, and this key is then
 * compared using the specified comparator.
 *
 * This type is usually used through the 'order' helper function, like:
 *
 *   auto closest = from(places)
 *                | orderBy([](Place& p) {
 *                    return -distance(p.location, here);
 *                  })
 *                | take(10);
 */
template <class Selector, class Comparer>
class Order : public Operator<Order<Selector, Comparer>> {
  Selector selector_;
  Comparer comparer_;

 public:
  Order() = default;

  explicit Order(Selector selector) : selector_(std::move(selector)) {}

  Order(Selector selector, Comparer comparer)
      : selector_(std::move(selector)), comparer_(std::move(comparer)) {}

  template <
      class Value,
      class Source,
      class StorageType = typename std::decay<Value>::type,
      class Result = invoke_result_t<Selector, Value>>
  class Generator : public GenImpl<
                        StorageType&&,
                        Generator<Value, Source, StorageType, Result>> {
    static_assert(!Source::infinite, "Cannot sort infinite source!");
    Source source_;
    Selector selector_;
    Comparer comparer_;

    typedef std::vector<StorageType> VectorType;

    VectorType asVector() const {
      auto comparer = [&](const StorageType& a, const StorageType& b) {
        return comparer_(selector_(a), selector_(b));
      };
      auto vals = source_ | as<VectorType>();
      std::sort(vals.begin(), vals.end(), comparer);
      return std::move(vals);
    }

   public:
    Generator(Source source, Selector selector, Comparer comparer)
        : source_(std::move(source)),
          selector_(std::move(selector)),
          comparer_(std::move(comparer)) {}

    VectorType operator|(const Collect<VectorType>&) const {
      return asVector();
    }

    VectorType operator|(const CollectTemplate<std::vector>&) const {
      return asVector();
    }

    template <class Body>
    void foreach(Body&& body) const {
      for (auto& value : asVector()) {
        body(std::move(value));
      }
    }

    template <class Handler>
    bool apply(Handler&& handler) const {
      auto comparer = [&](const StorageType& a, const StorageType& b) {
        // swapped for minHeap
        return comparer_(selector_(b), selector_(a));
      };
      auto heap = source_ | as<VectorType>();
      std::make_heap(heap.begin(), heap.end(), comparer);
      while (!heap.empty()) {
        std::pop_heap(heap.begin(), heap.end(), comparer);
        if (!handler(std::move(heap.back()))) {
          return false;
        }
        heap.pop_back();
      }
      return true;
    }

    // Can only be run on and produce finite generators
    static constexpr bool infinite = false;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), selector_, comparer_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), selector_, comparer_);
  }
};

/**
 * GroupBy - Group values by a given key selector, producing a sequence of
 * groups.
 *
 * This type is usually used through the 'groupBy' helper function, like:
 *
 *   auto bests
 *     = from(places)
 *     | groupBy([](const Place& p) {
 *         return p.city;
 *       })
 *     | [](Group<std::string, Place>&& g) {
 *         cout << g.key() << ": " << (g | first).description;
 *       };
 */
template <class Selector>
class GroupBy : public Operator<GroupBy<Selector>> {
  Selector selector_;

 public:
  GroupBy() {}

  explicit GroupBy(Selector selector) : selector_(std::move(selector)) {}

  template <
      class Value,
      class Source,
      class ValueDecayed = typename std::decay<Value>::type,
      class Key = invoke_result_t<Selector, Value>,
      class KeyDecayed = typename std::decay<Key>::type>
  class Generator
      : public GenImpl<
            Group<KeyDecayed, ValueDecayed>&&,
            Generator<Value, Source, ValueDecayed, Key, KeyDecayed>> {
    static_assert(!Source::infinite, "Cannot group infinite source!");
    Source source_;
    Selector selector_;

   public:
    Generator(Source source, Selector selector)
        : source_(std::move(source)), selector_(std::move(selector)) {}

    typedef Group<KeyDecayed, ValueDecayed> GroupType;

    template <class Handler>
    bool apply(Handler&& handler) const {
      std::unordered_map<KeyDecayed, typename GroupType::VectorType> groups;
      source_ | [&](Value value) {
        const Value& cv = value;
        auto& group = groups[selector_(cv)];
        group.push_back(std::forward<Value>(value));
      };
      for (auto& kg : groups) {
        GroupType group(kg.first, std::move(kg.second));
        if (!handler(std::move(group))) {
          return false;
        }
        kg.second.clear();
      }
      return true;
    }

    // Can only be run on and produce finite generators
    static constexpr bool infinite = false;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), selector_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), selector_);
  }
};

/**
 * GroupByAdjacent - Group adjacent values by a given key selector, producing a
 * sequence of groups. This differs from GroupBy in that only contiguous sets
 * of values with the same key are considered part of the same group. Unlike
 * GroupBy, this can be used on infinite sequences.
 *
 * This type is usually used through the 'groupByAdjacent' helper function:
 *
 *   auto tens
 *     = seq(0)
 *     | groupByAdjacent([](int i){ return (i / 10) % 2; })
 *
 * This example results in a list like [ 0:[0-9], 1:[10-19], 0:[20-29], ... ]
 */
template <class Selector>
class GroupByAdjacent : public Operator<GroupByAdjacent<Selector>> {
  Selector selector_;

 public:
  GroupByAdjacent() {}

  explicit GroupByAdjacent(Selector selector)
      : selector_(std::move(selector)) {}

  template <
      class Value,
      class Source,
      class ValueDecayed = typename std::decay<Value>::type,
      class Key = invoke_result_t<Selector, Value>,
      class KeyDecayed = typename std::decay<Key>::type>
  class Generator
      : public GenImpl<
            Group<KeyDecayed, ValueDecayed>&&,
            Generator<Value, Source, ValueDecayed, Key, KeyDecayed>> {
    Source source_;
    Selector selector_;

   public:
    Generator(Source source, Selector selector)
        : source_(std::move(source)), selector_(std::move(selector)) {}

    typedef Group<KeyDecayed, ValueDecayed> GroupType;

    template <class Handler>
    bool apply(Handler&& handler) const {
      Optional<KeyDecayed> key = none;
      typename GroupType::VectorType values;

      bool result = source_.apply([&](Value value) mutable {
        KeyDecayed newKey = selector_(value);

        // start the first group
        if (!key.hasValue()) {
          key.emplace(newKey);
        }

        if (key == newKey) {
          // grow the current group
          values.push_back(value);
        } else {
          // flush the current group
          GroupType group(key.value(), std::move(values));
          if (!handler(std::move(group))) {
            return false;
          }

          // start a new group
          key.emplace(newKey);
          values.clear();
          values.push_back(value);
        }
        return true;
      });

      if (!result) {
        return false;
      }

      if (!key.hasValue()) {
        return true;
      }

      // flush the final group
      GroupType group(key.value(), std::move(values));
      return handler(std::move(group));
    }

    static constexpr bool infinite = Source::infinite;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), selector_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), selector_);
  }
};

/*
 * TypeAssertion - For verifying the exact type of the value produced by a
 * generator. Useful for testing and debugging, and acts as a no-op at runtime.
 * Pass-through at runtime. Used through the 'assert_type<>()' factory method
 * like so:
 *
 *   auto c =  from(vector) | assert_type<int&>() | sum;
 *
 */
template <class Expected>
class TypeAssertion : public Operator<TypeAssertion<Expected>> {
 public:
  template <class Source, class Value>
  const Source& compose(const GenImpl<Value, Source>& source) const {
    static_assert(
        std::is_same<Expected, Value>::value, "assert_type() check failed");
    return source.self();
  }

  template <class Source, class Value>
  Source&& compose(GenImpl<Value, Source>&& source) const {
    static_assert(
        std::is_same<Expected, Value>::value, "assert_type() check failed");
    return std::move(source.self());
  }
};

/**
 * Distinct - For filtering duplicates out of a sequence. A selector may be
 * provided to generate a key to uniquify for each value.
 *
 * This type is usually used through the 'distinct' helper function, like:
 *
 *   auto closest = from(results)
 *                | distinctBy([](Item& i) {
 *                    return i.target;
 *                  })
 *                | take(10);
 */
template <class Selector>
class Distinct : public Operator<Distinct<Selector>> {
  Selector selector_;

 public:
  Distinct() = default;

  explicit Distinct(Selector selector) : selector_(std::move(selector)) {}

  template <class Value, class Source>
  class Generator : public GenImpl<Value, Generator<Value, Source>> {
    Source source_;
    Selector selector_;

    typedef typename std::decay<Value>::type StorageType;

    // selector_ cannot be passed an rvalue or it would end up passing the husk
    // of a value to the downstream operators.
    typedef const StorageType& ParamType;

    typedef invoke_result_t<Selector, ParamType> KeyType;
    typedef typename std::decay<KeyType>::type KeyStorageType;

   public:
    Generator(Source source, Selector selector)
        : source_(std::move(source)), selector_(std::move(selector)) {}

    template <class Body>
    void foreach(Body&& body) const {
      std::unordered_set<KeyStorageType> keysSeen;
      source_.foreach([&](Value value) {
        if (keysSeen.insert(selector_(ParamType(value))).second) {
          body(std::forward<Value>(value));
        }
      });
    }

    template <class Handler>
    bool apply(Handler&& handler) const {
      std::unordered_set<KeyStorageType> keysSeen;
      return source_.apply([&](Value value) -> bool {
        if (keysSeen.insert(selector_(ParamType(value))).second) {
          return handler(std::forward<Value>(value));
        }
        return true;
      });
    }

    // While running distinct on an infinite sequence might produce a
    // conceptually finite sequence, it will take infinite time
    static constexpr bool infinite = Source::infinite;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), selector_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), selector_);
  }
};

/**
 * Composer - Helper class for adapting pipelines into functors. Primarily used
 * for 'mapOp'.
 */
template <class Operators>
class Composer {
  Operators op_;

 public:
  explicit Composer(Operators op) : op_(std::move(op)) {}

  template <
      class Source,
      class Ret =
          decltype(std::declval<Operators>().compose(std::declval<Source>()))>
  Ret operator()(Source&& source) const {
    return op_.compose(std::forward<Source>(source));
  }
};

/**
 * Batch - For producing fixed-size batches of each value from a source.
 *
 * This type is usually used through the 'batch' helper function:
 *
 *   auto batchSums
 *     = seq(1, 10)
 *     | batch(3)
 *     | map([](const std::vector<int>& batch) {
 *         return from(batch) | sum;
 *       })
 *     | as<vector>();
 */
class Batch : public Operator<Batch> {
  size_t batchSize_;

 public:
  explicit Batch(size_t batchSize) : batchSize_(batchSize) {
    if (batchSize_ == 0) {
      throw std::invalid_argument("Batch size must be non-zero!");
    }
  }

  template <
      class Value,
      class Source,
      class StorageType = typename std::decay<Value>::type,
      class VectorType = std::vector<StorageType>>
  class Generator : public GenImpl<
                        VectorType&,
                        Generator<Value, Source, StorageType, VectorType>> {
    Source source_;
    size_t batchSize_;

   public:
    explicit Generator(Source source, size_t batchSize)
        : source_(std::move(source)), batchSize_(batchSize) {}

    template <class Handler>
    bool apply(Handler&& handler) const {
      VectorType batch_;
      batch_.reserve(batchSize_);
      bool shouldContinue = source_.apply([&](Value value) -> bool {
        batch_.push_back(std::forward<Value>(value));
        if (batch_.size() == batchSize_) {
          bool needMore = handler(batch_);
          batch_.clear();
          return needMore;
        }
        // Always need more if the handler is not called.
        return true;
      });
      // Flush everything, if and only if `handler` hasn't returned false.
      if (shouldContinue && !batch_.empty()) {
        shouldContinue = handler(batch_);
        batch_.clear();
      }
      return shouldContinue;
    }

    // Taking n-tuples of an infinite source is still infinite
    static constexpr bool infinite = Source::infinite;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), batchSize_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), batchSize_);
  }
};

/**
 * Window - For overlapping the lifetimes of pipeline values, especially with
 * Futures.
 *
 * This type is usually used through the 'window' helper function:
 *
 *   auto responses
 *     = byLine(STDIN)
 *     | map(makeRequestFuture)
 *     | window(1000)
 *     | map(waitFuture)
 *     | as<vector>();
 */
class Window : public Operator<Window> {
  size_t windowSize_;

 public:
  explicit Window(size_t windowSize) : windowSize_(windowSize) {
    if (windowSize_ == 0) {
      throw std::invalid_argument("Window size must be non-zero!");
    }
  }

  template <
      class Value,
      class Source,
      class StorageType = typename std::decay<Value>::type>
  class Generator
      : public GenImpl<StorageType&&, Generator<Value, Source, StorageType>> {
    Source source_;
    size_t windowSize_;

   public:
    explicit Generator(Source source, size_t windowSize)
        : source_(std::move(source)), windowSize_(windowSize) {}

    template <class Handler>
    bool apply(Handler&& handler) const {
      std::vector<StorageType> buffer;
      buffer.reserve(windowSize_);
      size_t readIndex = 0;
      bool shouldContinue = source_.apply([&](Value value) -> bool {
        if (buffer.size() < windowSize_) {
          buffer.push_back(std::forward<Value>(value));
        } else {
          StorageType& entry = buffer[readIndex++];
          if (readIndex == windowSize_) {
            readIndex = 0;
          }
          if (!handler(std::move(entry))) {
            return false;
          }
          entry = std::forward<Value>(value);
        }
        return true;
      });
      if (!shouldContinue) {
        return false;
      }
      if (buffer.size() < windowSize_) {
        for (StorageType& entry : buffer) {
          if (!handler(std::move(entry))) {
            return false;
          }
        }
      } else {
        for (size_t i = readIndex;;) {
          StorageType& entry = buffer[i++];
          if (!handler(std::move(entry))) {
            return false;
          }
          if (i == windowSize_) {
            i = 0;
          }
          if (i == readIndex) {
            break;
          }
        }
      }
      return true;
    }

    // Taking n-tuples of an infinite source is still infinite
    static constexpr bool infinite = Source::infinite;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), windowSize_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), windowSize_);
  }
};

/**
 * Concat - For flattening generators of generators.
 *
 * This type is usually used through the 'concat' static value, like:
 *
 *   auto edges =
 *       from(nodes)
 *     | map([](Node& x) {
 *           return from(x.neighbors)
 *                | map([&](Node& y) {
 *                    return Edge(x, y);
 *                  });
 *         })
 *     | concat
 *     | as<std::set>();
 */
class Concat : public Operator<Concat> {
 public:
  Concat() = default;

  template <
      class Inner,
      class Source,
      class InnerValue = typename std::decay<Inner>::type::ValueType>
  class Generator
      : public GenImpl<InnerValue, Generator<Inner, Source, InnerValue>> {
    Source source_;

   public:
    explicit Generator(Source source) : source_(std::move(source)) {}

    template <class Handler>
    bool apply(Handler&& handler) const {
      return source_.apply([&](Inner inner) -> bool {
        return inner.apply(std::forward<Handler>(handler));
      });
    }

    template <class Body>
    void foreach(Body&& body) const {
      source_.foreach(
          [&](Inner inner) { inner.foreach(std::forward<Body>(body)); });
    }

    // Resulting concatenation is only finite if both Source and Inner are also
    // finite. In one sence, if dosn't make sence to call concat when the Inner
    // generator is infinite (you could just call first), so we could also just
    // static_assert if the inner is infinite. Taking the less restrictive
    // approch for now.
    static constexpr bool infinite =
        Source::infinite || std::decay<Inner>::type::infinite;
  };

  template <class Value, class Source, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()));
  }

  template <class Value, class Source, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self());
  }
};

/**
 * RangeConcat - For flattening generators of iterables.
 *
 * This type is usually used through the 'rconcat' static value, like:
 *
 *   map<int, vector<int>> adjacency;
 *   auto sinks =
 *       from(adjacency)
 *     | get<1>()
 *     | rconcat()
 *     | as<std::set>();
 */
class RangeConcat : public Operator<RangeConcat> {
 public:
  RangeConcat() = default;

  template <
      class Range,
      class Source,
      class InnerValue = typename ValueTypeOfRange<Range>::RefType>
  class Generator
      : public GenImpl<InnerValue, Generator<Range, Source, InnerValue>> {
    Source source_;

   public:
    explicit Generator(Source source) : source_(std::move(source)) {}

    template <class Body>
    void foreach(Body&& body) const {
      source_.foreach([&](Range range) {
        for (auto& value : range) {
          body(value);
        }
      });
    }

    template <class Handler>
    bool apply(Handler&& handler) const {
      return source_.apply([&](Range range) -> bool {
        for (auto& value : range) {
          if (!handler(value)) {
            return false;
          }
        }
        return true;
      });
    }

    // This is similar to concat, except that the inner iterables all are finite
    // so the only thing that matters is that the source is infinite.
    static constexpr bool infinite = Source::infinite;
  };

  template <class Value, class Source, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()));
  }

  template <class Value, class Source, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self());
  }
};

/**
 * GuardImpl - For handling exceptions from downstream computation. Requires the
 * type of exception to catch, and handler function to invoke in the event of
 * the exception. Note that the handler may:
 *   1) return true to continue processing the sequence
 *   2) return false to end the sequence immediately
 *   3) throw, to pass the exception to the next catch
 * The handler must match the signature 'bool(Exception&, Value)'.
 *
 * This type is used through the `guard` helper, like so:
 *
 *  auto indexes
 *    = byLine(STDIN_FILENO)
 *    | guard<std::runtime_error>([](std::runtime_error& e,
 *                                   StringPiece sp) {
 *        LOG(ERROR) << sp << ": " << e.str();
 *        return true; // continue processing subsequent lines
 *      })
 *    | eachTo<int>()
 *    | as<vector>();
 *
 *  TODO(tjackson): Rename this back to Guard.
 **/
template <class Exception, class ErrorHandler>
class GuardImpl : public Operator<GuardImpl<Exception, ErrorHandler>> {
  ErrorHandler handler_;

 public:
  explicit GuardImpl(ErrorHandler handler) : handler_(std::move(handler)) {}

  template <class Value, class Source>
  class Generator : public GenImpl<Value, Generator<Value, Source>> {
    Source source_;
    ErrorHandler handler_;

   public:
    explicit Generator(Source source, ErrorHandler handler)
        : source_(std::move(source)), handler_(std::move(handler)) {}

    template <class Handler>
    bool apply(Handler&& handler) const {
      return source_.apply([&](Value value) -> bool {
        try {
          handler(std::forward<Value>(value));
          return true;
        } catch (Exception& e) {
          return handler_(e, std::forward<Value>(value));
        }
      });
    }

    // Just passes value though, length unaffected
    static constexpr bool infinite = Source::infinite;
  };

  template <class Value, class Source, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), handler_);
  }

  template <class Value, class Source, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), handler_);
  }
};

/**
 * Dereference - For dereferencing a sequence of pointers while filtering out
 * null pointers.
 *
 * This type is usually used through the 'dereference' static value, like:
 *
 *   auto refs = from(ptrs) | dereference;
 */
class Dereference : public Operator<Dereference> {
 public:
  Dereference() = default;

  template <
      class Value,
      class Source,
      class Result = decltype(*std::declval<Value>())>
  class Generator : public GenImpl<Result, Generator<Value, Source, Result>> {
    Source source_;

   public:
    explicit Generator(Source source) : source_(std::move(source)) {}

    template <class Body>
    void foreach(Body&& body) const {
      source_.foreach([&](Value value) {
        if (value) {
          return body(*std::forward<Value>(value));
        }
      });
    }

    template <class Handler>
    bool apply(Handler&& handler) const {
      return source_.apply([&](Value value) -> bool {
        if (value) {
          return handler(*std::forward<Value>(value));
        }
        return true;
      });
    }

    // Just passes value though, length unaffected
    static constexpr bool infinite = Source::infinite;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()));
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self());
  }
};

/**
 * Indirect - For producing a sequence of the addresses of the values in the
 * input.
 *
 * This type is usually used through the 'indirect' static value, like:
 *
 *   auto ptrs = from(refs) | indirect;
 */
class Indirect : public Operator<Indirect> {
 public:
  Indirect() = default;

  template <
      class Value,
      class Source,
      class Result = typename std::remove_reference<Value>::type*>
  class Generator : public GenImpl<Result, Generator<Value, Source, Result>> {
    Source source_;
    static_assert(
        !std::is_rvalue_reference<Value>::value,
        "Cannot use indirect on an rvalue");

   public:
    explicit Generator(Source source) : source_(std::move(source)) {}

    template <class Body>
    void foreach(Body&& body) const {
      source_.foreach(
          [&](Value value) { return body(&std::forward<Value>(value)); });
    }

    template <class Handler>
    bool apply(Handler&& handler) const {
      return source_.apply([&](Value value) -> bool {
        return handler(&std::forward<Value>(value));
      });
    }

    // Just passes value though, length unaffected
    static constexpr bool infinite = Source::infinite;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()));
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self());
  }
};

/**
 * Cycle - For repeating a sequence forever.
 *
 * This type is usually used through the 'cycle' static value, like:
 *
 *   auto tests
 *     = from(samples)
 *     | cycle
 *     | take(100);
 *
 * or in the finite case:
 *
 *   auto thrice = g | cycle(3);
 */
template <bool forever>
class Cycle : public Operator<Cycle<forever>> {
  off_t limit_; // not used if forever == true
 public:
  Cycle() = default;

  explicit Cycle(off_t limit) : limit_(limit) {
    static_assert(
        !forever,
        "Cycle limit constructor should not be used when forever == true.");
  }

  template <class Value, class Source>
  class Generator : public GenImpl<Value, Generator<Value, Source>> {
    Source source_;
    off_t limit_;

   public:
    explicit Generator(Source source, off_t limit)
        : source_(std::move(source)), limit_(limit) {}

    template <class Handler>
    bool apply(Handler&& handler) const {
      bool cont;
      auto handler2 = [&](Value value) {
        cont = handler(std::forward<Value>(value));
        return cont;
      };
      // Becomes an infinte loop if forever == true
      for (off_t count = 0; (forever || count != limit_); ++count) {
        cont = false;
        source_.apply(handler2);
        if (!cont) {
          return false;
        }
      }
      return true;
    }

    // This is the hardest one to infer. If we are simply doing a finite cycle,
    // then (gen | cycle(n)) is infinite if and only if gen is infinite.
    // However, if we are doing an infinite cycle, (gen | cycle) is infinite
    // unless gen is empty. However, we will always mark (gen | cycle) as
    // infinite, because patterns such as (gen | cycle | count) can either take
    // on exactly one value, or infinite loop.
    static constexpr bool infinite = forever || Source::infinite;
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), limit_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), limit_);
  }

  /**
   * Convenience function for finite cycles used like:
   *
   *  auto tripled = gen | cycle(3);
   */
  Cycle<false> operator()(off_t limit) const {
    return Cycle<false>(limit);
  }
};

/*
 ******************************* Sinks *****************************************
 */

/**
 * FoldLeft - Left-associative functional fold. For producing an aggregate value
 * from a seed and a folder function. Useful for custom aggregators on a
 * sequence.
 *
 * This type is primarily used through the 'foldl' helper method, like:
 *
 *   double movingAverage = from(values)
 *                        | foldl(0.0, [](double avg, double sample) {
 *                            return sample * 0.1 + avg * 0.9;
 *                          });
 */
template <class Seed, class Fold>
class FoldLeft : public Operator<FoldLeft<Seed, Fold>> {
  Seed seed_;
  Fold fold_;

 public:
  FoldLeft() = default;
  FoldLeft(Seed seed, Fold fold)
      : seed_(std::move(seed)), fold_(std::move(fold)) {}

  template <class Source, class Value>
  Seed compose(const GenImpl<Value, Source>& source) const {
    static_assert(!Source::infinite, "Cannot foldl infinite source");
    Seed accum = seed_;
    source | [&](Value v) {
      accum = fold_(std::move(accum), std::forward<Value>(v));
    };
    return accum;
  }
};

/**
 * First - For finding the first value in a sequence.
 *
 * This type is primarily used through the 'first' static value, like:
 *
 *   int firstThreeDigitPrime = seq(100) | filter(isPrime) | first;
 */
class First : public Operator<First> {
 public:
  First() = default;

  template <
      class Source,
      class Value,
      class StorageType = typename std::decay<Value>::type>
  Optional<StorageType> compose(const GenImpl<Value, Source>& source) const {
    Optional<StorageType> accum;
    source | [&](Value v) -> bool {
      accum = std::forward<Value>(v);
      return false;
    };
    return accum;
  }
};

/**
 * IsEmpty - a helper class for isEmpty and notEmpty
 *
 * Essentially returns 'result' if the source is empty. Note that this cannot be
 * called on an infinite source, because then there is only one possible return
 * value.
 *
 *
 *  Used primarily through 'isEmpty' and 'notEmpty' static values
 *
 *  bool hasPrimes = g | filter(prime) | notEmpty;
 *  bool lacksEvens = g | filter(even) | isEmpty;
 *
 *  Also used in the implementation of 'any' and 'all'
 */
template <bool emptyResult>
class IsEmpty : public Operator<IsEmpty<emptyResult>> {
 public:
  IsEmpty() = default;

  template <class Source, class Value>
  bool compose(const GenImpl<Value, Source>& source) const {
    static_assert(
        !Source::infinite,
        "Cannot call 'all', 'any', 'isEmpty', or 'notEmpty' on "
        "infinite source. 'all' and 'isEmpty' will either return "
        "false or hang. 'any' or 'notEmpty' will either return true "
        "or hang.");
    bool ans = emptyResult;
    source | [&](Value /* v */) -> bool {
      ans = !emptyResult;
      return false;
    };
    return ans;
  }
};

/**
 * Reduce - Functional reduce, for recursively combining values from a source
 * using a reducer function until there is only one item left. Useful for
 * combining values when an empty sequence doesn't make sense.
 *
 * This type is primarily used through the 'reduce' helper method, like:
 *
 *   sring longest = from(names)
 *                 | reduce([](string&& best, string& current) {
 *                     return best.size() >= current.size() ? best : current;
 *                   });
 */
template <class Reducer>
class Reduce : public Operator<Reduce<Reducer>> {
  Reducer reducer_;

 public:
  Reduce() = default;
  explicit Reduce(Reducer reducer) : reducer_(std::move(reducer)) {}

  template <
      class Source,
      class Value,
      class StorageType = typename std::decay<Value>::type>
  Optional<StorageType> compose(const GenImpl<Value, Source>& source) const {
    static_assert(!Source::infinite, "Cannot reduce infinite source");
    Optional<StorageType> accum;
    source | [&](Value v) {
      if (auto target = accum.get_pointer()) {
        *target = reducer_(std::move(*target), std::forward<Value>(v));
      } else {
        accum = std::forward<Value>(v);
      }
    };
    return accum;
  }
};

/**
 * Count - for simply counting the items in a collection.
 *
 * This type is usually used through its singleton, 'count':
 *
 *   auto shortPrimes = seq(1, 100) | filter(isPrime) | count;
 */
class Count : public Operator<Count> {
 public:
  Count() = default;

  template <class Source, class Value>
  size_t compose(const GenImpl<Value, Source>& source) const {
    static_assert(!Source::infinite, "Cannot count infinite source");
    return foldl(
               size_t(0), [](size_t accum, Value /* v */) { return accum + 1; })
        .compose(source);
  }
};

/**
 * Sum - For simply summing up all the values from a source.
 *
 * This type is usually used through its singleton, 'sum':
 *
 *   auto gaussSum = seq(1, 100) | sum;
 */
class Sum : public Operator<Sum> {
 public:
  Sum() = default;

  template <
      class Source,
      class Value,
      class StorageType = typename std::decay<Value>::type>
  StorageType compose(const GenImpl<Value, Source>& source) const {
    static_assert(!Source::infinite, "Cannot sum infinite source");
    return foldl(
               StorageType(0),
               [](StorageType&& accum, Value v) {
                 return std::move(accum) + std::forward<Value>(v);
               })
        .compose(source);
  }
};

/**
 * Contains - For testing whether a value matching the given value is contained
 * in a sequence.
 *
 * This type should be used through the 'contains' helper method, like:
 *
 *   bool contained = seq(1, 10) | map(square) | contains(49);
 */
template <class Needle>
class Contains : public Operator<Contains<Needle>> {
  Needle needle_;

 public:
  explicit Contains(Needle needle) : needle_(std::move(needle)) {}

  template <
      class Source,
      class Value,
      class StorageType = typename std::decay<Value>::type>
  bool compose(const GenImpl<Value, Source>& source) const {
    static_assert(
        !Source::infinite,
        "Calling contains on an infinite source might cause "
        "an infinite loop.");
    return !(source | [this](Value value) {
      return !(needle_ == std::forward<Value>(value));
    });
  }
};

/**
 * Min - For a value which minimizes a key, where the key is determined by a
 * given selector, and compared by given comparer.
 *
 * This type is usually used through the singletone 'min' or through the helper
 * functions 'minBy' and 'maxBy'.
 *
 *   auto oldest = from(people)
 *               | minBy([](Person& p) {
 *                   return p.dateOfBirth;
 *                 });
 */
template <class Selector, class Comparer>
class Min : public Operator<Min<Selector, Comparer>> {
  Selector selector_;
  Comparer comparer_;

  template <typename T>
  const T& asConst(const T& t) const {
    return t;
  }

 public:
  Min() = default;

  explicit Min(Selector selector) : selector_(std::move(selector)) {}

  Min(Selector selector, Comparer comparer)
      : selector_(std::move(selector)), comparer_(std::move(comparer)) {}

  template <
      class Value,
      class Source,
      class StorageType = typename std::decay<Value>::type,
      class Key = typename std::decay<invoke_result_t<Selector, Value>>::type>
  Optional<StorageType> compose(const GenImpl<Value, Source>& source) const {
    static_assert(
        !Source::infinite,
        "Calling min or max on an infinite source will cause "
        "an infinite loop.");
    Optional<StorageType> min;
    Optional<Key> minKey;
    source | [&](Value v) {
      Key key = selector_(asConst(v)); // so that selector_ cannot mutate v
      if (auto lastKey = minKey.get_pointer()) {
        if (!comparer_(key, *lastKey)) {
          return;
        }
      }
      minKey = std::move(key);
      min = std::forward<Value>(v);
    };
    return min;
  }
};

/**
 * Append - For collecting values from a source into a given output container
 * by appending.
 *
 * This type is usually used through the helper function 'appendTo', like:
 *
 *   vector<int64_t> ids;
 *   from(results) | map([](Person& p) { return p.id })
 *                 | appendTo(ids);
 */
template <class Collection>
class Append : public Operator<Append<Collection>> {
  Collection* collection_;

 public:
  explicit Append(Collection* collection) : collection_(collection) {}

  template <class Value, class Source>
  Collection& compose(const GenImpl<Value, Source>& source) const {
    static_assert(!Source::infinite, "Cannot appendTo with infinite source");
    source | [&](Value v) {
      collection_->insert(collection_->end(), std::forward<Value>(v));
    };
    return *collection_;
  }
};

/**
 * Collect - For collecting values from a source in a collection of the desired
 * type.
 *
 * This type is usually used through the helper function 'as', like:
 *
 *   std::string upper = from(stringPiece)
 *                     | map(&toupper)
 *                     | as<std::string>();
 */
template <class Collection>
class Collect : public Operator<Collect<Collection>> {
 public:
  Collect() = default;

  template <
      class Value,
      class Source,
      class StorageType = typename std::decay<Value>::type>
  Collection compose(const GenImpl<Value, Source>& source) const {
    static_assert(
        !Source::infinite, "Cannot convert infinite source to object with as.");
    Collection collection;
    source | [&](Value v) {
      collection.insert(collection.end(), std::forward<Value>(v));
    };
    return collection;
  }
};

/**
 * CollectTemplate - For collecting values from a source in a collection
 * constructed using the specified template type. Given the type of values
 * produced by the given generator, the collection type will be:
 *   Container<Value, Allocator<Value>>
 *
 * The allocator defaults to std::allocator, so this may be used for the STL
 * containers by simply using operators like 'as<set>', 'as<deque>',
 * 'as<vector>'. 'as', here is the helper method which is the usual means of
 * constructing this operator.
 *
 * Example:
 *
 *   set<string> uniqueNames = from(names) | as<set>();
 */
template <
    template <class, class> class Container,
    template <class> class Allocator>
class CollectTemplate : public Operator<CollectTemplate<Container, Allocator>> {
 public:
  CollectTemplate() = default;

  template <
      class Value,
      class Source,
      class StorageType = typename std::decay<Value>::type,
      class Collection = Container<StorageType, Allocator<StorageType>>>
  Collection compose(const GenImpl<Value, Source>& source) const {
    static_assert(
        !Source::infinite, "Cannot convert infinite source to object with as.");
    Collection collection;
    source | [&](Value v) {
      collection.insert(collection.end(), std::forward<Value>(v));
    };
    return collection;
  }
};

/**
 * UnwrapOr - For unwrapping folly::Optional values, or providing the given
 * fallback value. Usually used through the 'unwrapOr' helper like so:
 *
 *   auto best = from(scores) | max | unwrapOr(-1);
 *
 * Note that the fallback value needn't match the value in the Optional it is
 * unwrapping. If mis-matched types are supported, the common type of the two is
 * returned by value. If the types match, a reference (T&& > T& > const T&) is
 * returned.
 */
template <class T>
class UnwrapOr {
 public:
  explicit UnwrapOr(T&& value) : value_(std::move(value)) {}
  explicit UnwrapOr(const T& value) : value_(value) {}

  T& value() {
    return value_;
  }
  const T& value() const {
    return value_;
  }

 private:
  T value_;
};

template <class T>
T&& operator|(Optional<T>&& opt, UnwrapOr<T>&& fallback) {
  if (T* p = opt.get_pointer()) {
    return std::move(*p);
  }
  return std::move(fallback.value());
}

template <class T>
T& operator|(Optional<T>& opt, UnwrapOr<T>& fallback) {
  if (T* p = opt.get_pointer()) {
    return *p;
  }
  return fallback.value();
}

template <class T>
const T& operator|(const Optional<T>& opt, const UnwrapOr<T>& fallback) {
  if (const T* p = opt.get_pointer()) {
    return *p;
  }
  return fallback.value();
}

// Mixed type unwrapping always returns values, moving where possible
template <
    class T,
    class U,
    class R = typename std::enable_if<
        !std::is_same<T, U>::value,
        typename std::common_type<T, U>::type>::type>
R operator|(Optional<T>&& opt, UnwrapOr<U>&& fallback) {
  if (T* p = opt.get_pointer()) {
    return std::move(*p);
  }
  return std::move(fallback.value());
}

template <
    class T,
    class U,
    class R = typename std::enable_if<
        !std::is_same<T, U>::value,
        typename std::common_type<T, U>::type>::type>
R operator|(const Optional<T>& opt, UnwrapOr<U>&& fallback) {
  if (const T* p = opt.get_pointer()) {
    return *p;
  }
  return std::move(fallback.value());
}

template <
    class T,
    class U,
    class R = typename std::enable_if<
        !std::is_same<T, U>::value,
        typename std::common_type<T, U>::type>::type>
R operator|(Optional<T>&& opt, const UnwrapOr<U>& fallback) {
  if (T* p = opt.get_pointer()) {
    return std::move(*p);
  }
  return fallback.value();
}

template <
    class T,
    class U,
    class R = typename std::enable_if<
        !std::is_same<T, U>::value,
        typename std::common_type<T, U>::type>::type>
R operator|(const Optional<T>& opt, const UnwrapOr<U>& fallback) {
  if (const T* p = opt.get_pointer()) {
    return *p;
  }
  return fallback.value();
}

/**
 * Unwrap - For unwrapping folly::Optional values in a folly::gen style. Usually
 * used through the 'unwrap' instace like so:
 *
 *   auto best = from(scores) | max | unwrap; // may throw
 */
class Unwrap {};

template <class T>
T&& operator|(Optional<T>&& opt, const Unwrap&) {
  return std::move(opt.value());
}

template <class T>
T& operator|(Optional<T>& opt, const Unwrap&) {
  return opt.value();
}

template <class T>
const T& operator|(const Optional<T>& opt, const Unwrap&) {
  return opt.value();
}

} // namespace detail

/**
 * VirtualGen<T> - For wrapping template types in simple polymorphic wrapper.
 **/
template <class Value>
class VirtualGen : public GenImpl<Value, VirtualGen<Value>> {
  class WrapperBase {
   public:
    virtual ~WrapperBase() noexcept {}
    virtual bool apply(const std::function<bool(Value)>& handler) const = 0;
    virtual void foreach(const std::function<void(Value)>& body) const = 0;
    virtual std::unique_ptr<const WrapperBase> clone() const = 0;
  };

  template <class Wrapped>
  class WrapperImpl : public WrapperBase {
    Wrapped wrapped_;

   public:
    explicit WrapperImpl(Wrapped wrapped) : wrapped_(std::move(wrapped)) {}

    bool apply(const std::function<bool(Value)>& handler) const override {
      return wrapped_.apply(handler);
    }

    void foreach(const std::function<void(Value)>& body) const override {
      wrapped_.foreach(body);
    }

    std::unique_ptr<const WrapperBase> clone() const override {
      return std::unique_ptr<const WrapperBase>(new WrapperImpl(wrapped_));
    }
  };

  std::unique_ptr<const WrapperBase> wrapper_;

 public:
  template <class Self>
  /* implicit */ VirtualGen(Self source)
      : wrapper_(new WrapperImpl<Self>(std::move(source))) {}

  VirtualGen(VirtualGen&& source) noexcept
      : wrapper_(std::move(source.wrapper_)) {}

  VirtualGen(const VirtualGen& source) : wrapper_(source.wrapper_->clone()) {}

  VirtualGen& operator=(const VirtualGen& source) {
    wrapper_.reset(source.wrapper_->clone());
    return *this;
  }

  VirtualGen& operator=(VirtualGen&& source) noexcept {
    wrapper_ = std::move(source.wrapper_);
    return *this;
  }

  bool apply(const std::function<bool(Value)>& handler) const {
    return wrapper_->apply(handler);
  }

  void foreach(const std::function<void(Value)>& body) const {
    wrapper_->foreach(body);
  }
};

/**
 * non-template operators, statically defined to avoid the need for anything but
 * the header.
 */
constexpr detail::Sum sum{};

constexpr detail::Count count{};

constexpr detail::First first{};

constexpr detail::IsEmpty<true> isEmpty{};

constexpr detail::IsEmpty<false> notEmpty{};

constexpr detail::Min<Identity, Less> min{};

constexpr detail::Min<Identity, Greater> max{};

constexpr detail::Order<Identity> order{};

constexpr detail::Distinct<Identity> distinct{};

constexpr detail::Map<Move> move{};

constexpr detail::Concat concat{};

constexpr detail::RangeConcat rconcat{};

constexpr detail::Cycle<true> cycle{};

constexpr detail::Dereference dereference{};

constexpr detail::Indirect indirect{};

constexpr detail::Unwrap unwrap{};

template <class Number>
inline detail::Take take(Number count) {
  if (count < 0) {
    throw std::invalid_argument("Negative value passed to take()");
  }
  return detail::Take(static_cast<size_t>(count));
}

inline detail::Stride stride(size_t s) {
  return detail::Stride(s);
}

template <class Random = std::default_random_engine>
inline detail::Sample<Random> sample(size_t count, Random rng = Random()) {
  return detail::Sample<Random>(count, std::move(rng));
}

inline detail::Skip skip(size_t count) {
  return detail::Skip(count);
}

inline detail::Batch batch(size_t batchSize) {
  return detail::Batch(batchSize);
}

inline detail::Window window(size_t windowSize) {
  return detail::Window(windowSize);
}

} // namespace gen
} // namespace folly

FOLLY_POP_WARNING
