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

#ifndef FOLLY_GEN_COMBINE_H_
#error This file may only be included from folly/gen/Combine.h
#endif

#include <iterator>
#include <system_error>
#include <tuple>
#include <type_traits>

namespace folly {
namespace gen {
namespace detail {

/**
 * Interleave
 *
 * Alternate values from a sequence with values from a sequence container.
 * Stops once we run out of values from either source.
 */
template <class Container>
class Interleave : public Operator<Interleave<Container>> {
  // see comment about copies in CopiedSource
  const std::shared_ptr<const Container> container_;

 public:
  explicit Interleave(Container container)
      : container_(new Container(std::move(container))) {}

  template <class Value, class Source>
  class Generator : public GenImpl<Value, Generator<Value, Source>> {
    Source source_;
    const std::shared_ptr<const Container> container_;
    typedef const typename Container::value_type& ConstRefType;

    static_assert(
        std::is_same<const Value&, ConstRefType>::value,
        "Only matching types may be interleaved");

   public:
    explicit Generator(
        Source source,
        const std::shared_ptr<const Container> container)
        : source_(std::move(source)), container_(container) {}

    template <class Handler>
    bool apply(Handler&& handler) const {
      auto iter = container_->begin();
      return source_.apply([&](const Value& value) -> bool {
        if (iter == container_->end()) {
          return false;
        }
        if (!handler(value)) {
          return false;
        }
        if (!handler(*iter)) {
          return false;
        }
        iter++;
        return true;
      });
    }
  };

  template <class Value2, class Source, class Gen = Generator<Value2, Source>>
  Gen compose(GenImpl<Value2, Source>&& source) const {
    return Gen(std::move(source.self()), container_);
  }

  template <class Value2, class Source, class Gen = Generator<Value2, Source>>
  Gen compose(const GenImpl<Value2, Source>& source) const {
    return Gen(source.self(), container_);
  }
};

/**
 * Zip
 *
 * Combine inputs from Source with values from a sequence container by merging
 * them into a tuple.
 *
 */
template <class Container>
class Zip : public Operator<Zip<Container>> {
  // see comment about copies in CopiedSource
  const std::shared_ptr<const Container> container_;

 public:
  explicit Zip(Container container)
      : container_(new Container(std::move(container))) {}

  template <
      class Value1,
      class Source,
      class Value2 = decltype(*std::begin(*container_)),
      class Result = std::tuple<
          typename std::decay<Value1>::type,
          typename std::decay<Value2>::type>>
  class Generator
      : public GenImpl<Result, Generator<Value1, Source, Value2, Result>> {
    Source source_;
    const std::shared_ptr<const Container> container_;

   public:
    explicit Generator(
        Source source,
        const std::shared_ptr<const Container> container)
        : source_(std::move(source)), container_(container) {}

    template <class Handler>
    bool apply(Handler&& handler) const {
      auto iter = container_->begin();
      return (source_.apply([&](Value1 value) -> bool {
        if (iter == container_->end()) {
          return false;
        }
        if (!handler(std::make_tuple(std::forward<Value1>(value), *iter))) {
          return false;
        }
        ++iter;
        return true;
      }));
    }
  };

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(GenImpl<Value, Source>&& source) const {
    return Gen(std::move(source.self()), container_);
  }

  template <class Source, class Value, class Gen = Generator<Value, Source>>
  Gen compose(const GenImpl<Value, Source>& source) const {
    return Gen(source.self(), container_);
  }
};

template <class... Types1, class... Types2>
auto add_to_tuple(std::tuple<Types1...> t1, std::tuple<Types2...> t2)
    -> std::tuple<Types1..., Types2...> {
  return std::tuple_cat(std::move(t1), std::move(t2));
}

template <class... Types1, class Type2>
auto add_to_tuple(std::tuple<Types1...> t1, Type2&& t2) -> decltype(
    std::tuple_cat(std::move(t1), std::make_tuple(std::forward<Type2>(t2)))) {
  return std::tuple_cat(
      std::move(t1), std::make_tuple(std::forward<Type2>(t2)));
}

template <class Type1, class... Types2>
auto add_to_tuple(Type1&& t1, std::tuple<Types2...> t2) -> decltype(
    std::tuple_cat(std::make_tuple(std::forward<Type1>(t1)), std::move(t2))) {
  return std::tuple_cat(
      std::make_tuple(std::forward<Type1>(t1)), std::move(t2));
}

template <class Type1, class Type2>
auto add_to_tuple(Type1&& t1, Type2&& t2) -> decltype(
    std::make_tuple(std::forward<Type1>(t1), std::forward<Type2>(t2))) {
  return std::make_tuple(std::forward<Type1>(t1), std::forward<Type2>(t2));
}

// Merges a 2-tuple into a single tuple (get<0> could already be a tuple)
class MergeTuples {
 public:
  template <class Tuple>
  auto operator()(Tuple&& value) const -> decltype(add_to_tuple(
      std::get<0>(std::forward<Tuple>(value)),
      std::get<1>(std::forward<Tuple>(value)))) {
    static_assert(
        std::tuple_size<typename std::remove_reference<Tuple>::type>::value ==
            2,
        "Can only merge tuples of size 2");
    return add_to_tuple(
        std::get<0>(std::forward<Tuple>(value)),
        std::get<1>(std::forward<Tuple>(value)));
  }
};

} // namespace detail

// TODO(mcurtiss): support zip() for N>1 operands. Because of variadic problems,
// this might not be easily possible until gcc4.8 is available.
template <
    class Source,
    class Zip = detail::Zip<typename std::decay<Source>::type>>
Zip zip(Source&& source) {
  return Zip(std::forward<Source>(source));
}

} // namespace gen
} // namespace folly
