/*
 * Copyright 2016-present Facebook, Inc.
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
/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */
#pragma once

#include <boost/function_types/is_member_pointer.hpp>
#include <boost/function_types/parameter_types.hpp>
#include <boost/mpl/equal.hpp>
#include <boost/mpl/pop_front.hpp>
#include <boost/mpl/transform.hpp>
#include <boost/mpl/vector.hpp>

#include <folly/Conv.h>

namespace folly {

// Auto-conversion of key/value based on callback signature, documented in
// DynamicParser.h.
namespace detail {
class IdentifyCallable {
 public:
  enum class Kind { Function, MemberFunction };
  template <typename Fn>
  constexpr static Kind getKind() {
    return test<Fn>(nullptr);
  }

 private:
  template <typename Fn>
  using IsMemFn =
      typename boost::function_types::template is_member_pointer<decltype(
          &Fn::operator())>;
  template <typename Fn>
  constexpr static typename std::enable_if<IsMemFn<Fn>::value, Kind>::type test(
      IsMemFn<Fn>*) {
    return IdentifyCallable::Kind::MemberFunction;
  }
  template <typename>
  constexpr static Kind test(...) {
    return IdentifyCallable::Kind::Function;
  }
};

template <IdentifyCallable::Kind, typename Fn>
struct ArgumentTypesByKind {};
template <typename Fn>
struct ArgumentTypesByKind<IdentifyCallable::Kind::MemberFunction, Fn> {
  using type = typename boost::mpl::template pop_front<
      typename boost::function_types::template parameter_types<decltype(
          &Fn::operator())>::type>::type;
};
template <typename Fn>
struct ArgumentTypesByKind<IdentifyCallable::Kind::Function, Fn> {
  using type = typename boost::function_types::template parameter_types<Fn>;
};

template <typename Fn>
using ArgumentTypes =
    typename ArgumentTypesByKind<IdentifyCallable::getKind<Fn>(), Fn>::type;

// At present, works for lambdas or plain old functions, but can be
// extended.  The comparison deliberately strips cv-qualifieers and
// reference, leaving that choice up to the caller.
template <typename Fn, typename... Args>
struct HasArgumentTypes
    : boost::mpl::template equal<
          typename boost::mpl::template transform<
              typename boost::mpl::template transform<
                  ArgumentTypes<Fn>,
                  typename std::template remove_reference<boost::mpl::_1>>::
                  type,
              typename std::template remove_cv<boost::mpl::_1>>::type,
          boost::mpl::vector<Args...>>::type {};
template <typename... Args>
using EnableForArgTypes =
    typename std::enable_if<HasArgumentTypes<Args...>::value, void>::type;

// No arguments
template <typename Fn>
EnableForArgTypes<Fn>
invokeForKeyValue(Fn f, const folly::dynamic&, const folly::dynamic&) {
  f();
}

// 1 argument -- pass only the value
//
// folly::dynamic (no conversion)
template <typename Fn>
EnableForArgTypes<Fn, folly::dynamic>
invokeForKeyValue(Fn fn, const folly::dynamic&, const folly::dynamic& v) {
  fn(v);
}
// int64_t
template <typename Fn>
EnableForArgTypes<Fn, int64_t>
invokeForKeyValue(Fn fn, const folly::dynamic&, const folly::dynamic& v) {
  fn(v.asInt());
}
// bool
template <typename Fn>
EnableForArgTypes<Fn, bool>
invokeForKeyValue(Fn fn, const folly::dynamic&, const folly::dynamic& v) {
  fn(v.asBool());
}
// double
template <typename Fn>
EnableForArgTypes<Fn, double>
invokeForKeyValue(Fn fn, const folly::dynamic&, const folly::dynamic& v) {
  fn(v.asDouble());
}
// std::string
template <typename Fn>
EnableForArgTypes<Fn, std::string>
invokeForKeyValue(Fn fn, const folly::dynamic&, const folly::dynamic& v) {
  fn(v.asString());
}

//
// 2 arguments -- pass both the key and the value.
//

// Pass the key as folly::dynamic, without conversion
//
// folly::dynamic, folly::dynamic (no conversion of value, either)
template <typename Fn>
EnableForArgTypes<Fn, folly::dynamic, folly::dynamic>
invokeForKeyValue(Fn fn, const folly::dynamic& k, const folly::dynamic& v) {
  fn(k, v);
}
// folly::dynamic, int64_t
template <typename Fn>
EnableForArgTypes<Fn, folly::dynamic, int64_t>
invokeForKeyValue(Fn fn, const folly::dynamic& k, const folly::dynamic& v) {
  fn(k, v.asInt());
}
// folly::dynamic, bool
template <typename Fn>
EnableForArgTypes<Fn, folly::dynamic, bool>
invokeForKeyValue(Fn fn, const folly::dynamic& k, const folly::dynamic& v) {
  fn(k, v.asBool());
}
// folly::dynamic, double
template <typename Fn>
EnableForArgTypes<Fn, folly::dynamic, double>
invokeForKeyValue(Fn fn, const folly::dynamic& k, const folly::dynamic& v) {
  fn(k, v.asDouble());
}
// folly::dynamic, std::string
template <typename Fn>
EnableForArgTypes<Fn, folly::dynamic, std::string>
invokeForKeyValue(Fn fn, const folly::dynamic& k, const folly::dynamic& v) {
  fn(k, v.asString());
}

// Convert the key to std::string.
//
// std::string, folly::dynamic (no conversion of value)
template <typename Fn>
EnableForArgTypes<Fn, std::string, folly::dynamic>
invokeForKeyValue(Fn fn, const folly::dynamic& k, const folly::dynamic& v) {
  fn(k.asString(), v);
}
// std::string, int64_t
template <typename Fn>
EnableForArgTypes<Fn, std::string, int64_t>
invokeForKeyValue(Fn fn, const folly::dynamic& k, const folly::dynamic& v) {
  fn(k.asString(), v.asInt());
}
// std::string, bool
template <typename Fn>
EnableForArgTypes<Fn, std::string, bool>
invokeForKeyValue(Fn fn, const folly::dynamic& k, const folly::dynamic& v) {
  fn(k.asString(), v.asBool());
}
// std::string, double
template <typename Fn>
EnableForArgTypes<Fn, std::string, double>
invokeForKeyValue(Fn fn, const folly::dynamic& k, const folly::dynamic& v) {
  fn(k.asString(), v.asDouble());
}
// std::string, std::string
template <typename Fn>
EnableForArgTypes<Fn, std::string, std::string>
invokeForKeyValue(Fn fn, const folly::dynamic& k, const folly::dynamic& v) {
  fn(k.asString(), v.asString());
}

// Convert the key to int64_t (good for arrays).
//
// int64_t, folly::dynamic (no conversion of value)
template <typename Fn>
EnableForArgTypes<Fn, int64_t, folly::dynamic>
invokeForKeyValue(Fn fn, const folly::dynamic& k, const folly::dynamic& v) {
  fn(k.asInt(), v);
}
// int64_t, int64_t
template <typename Fn>
EnableForArgTypes<Fn, int64_t, int64_t>
invokeForKeyValue(Fn fn, const folly::dynamic& k, const folly::dynamic& v) {
  fn(k.asInt(), v.asInt());
}
// int64_t, bool
template <typename Fn>
EnableForArgTypes<Fn, int64_t, bool>
invokeForKeyValue(Fn fn, const folly::dynamic& k, const folly::dynamic& v) {
  fn(k.asInt(), v.asBool());
}
// int64_t, double
template <typename Fn>
EnableForArgTypes<Fn, int64_t, double>
invokeForKeyValue(Fn fn, const folly::dynamic& k, const folly::dynamic& v) {
  fn(k.asInt(), v.asDouble());
}
// int64_t, std::string
template <typename Fn>
EnableForArgTypes<Fn, int64_t, std::string>
invokeForKeyValue(Fn fn, const folly::dynamic& k, const folly::dynamic& v) {
  fn(k.asInt(), v.asString());
}
} // namespace detail

template <typename Fn>
void DynamicParser::optional(const folly::dynamic& key, Fn fn) {
  wrapError(&key, [&]() {
    if (auto vp = value().get_ptr(key)) {
      parse(key, *vp, fn);
    }
  });
}

//
// Implementation of DynamicParser template & inline methods.
//

template <typename Fn>
void DynamicParser::required(const folly::dynamic& key, Fn fn) {
  wrapError(&key, [&]() {
    auto vp = value().get_ptr(key);
    if (!vp) {
      throw std::runtime_error(folly::to<std::string>(
          "Couldn't find key ",
          detail::toPseudoJson(key),
          " in dynamic object"));
    }
    parse(key, *vp, fn);
  });
}

template <typename Fn>
void DynamicParser::objectItems(Fn fn) {
  wrapError(nullptr, [&]() {
    for (const auto& kv : value().items()) { // .items() can throw
      parse(kv.first, kv.second, fn);
    }
  });
}

template <typename Fn>
void DynamicParser::arrayItems(Fn fn) {
  wrapError(nullptr, [&]() {
    size_t i = 0;
    for (const auto& v : value()) { // Iteration can throw
      parse(i, v, fn); // i => dynamic cannot throw
      ++i;
    }
  });
}

template <typename Fn>
void DynamicParser::wrapError(const folly::dynamic* lookup_k, Fn fn) {
  try {
    fn();
  } catch (DynamicParserLogicError&) {
    // When the parser is misused, we throw all the way up to the user,
    // instead of reporting it as if the input is invalid.
    throw;
  } catch (DynamicParserParseError&) {
    // We are just bubbling up a parse error for OnError::THROW.
    throw;
  } catch (const std::exception& ex) {
    reportError(lookup_k, ex);
  }
}

template <typename Fn>
void DynamicParser::parse(
    const folly::dynamic& k,
    const folly::dynamic& v,
    Fn fn) {
  auto guard = stack_.push(k, v); // User code can nest parser calls.
  wrapError(nullptr, [&]() { detail::invokeForKeyValue(fn, k, v); });
}

inline const folly::dynamic& DynamicParser::ParserStack::key() const {
  if (!key_) {
    throw DynamicParserLogicError("Only call key() inside parsing callbacks.");
  }
  return *key_;
}

inline const folly::dynamic& DynamicParser::ParserStack::value() const {
  if (!value_) {
    throw DynamicParserLogicError(
        "Parsing nullptr, or parsing after releaseErrors()");
  }
  return *value_;
}

} // namespace folly
