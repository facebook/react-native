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
#include <folly/experimental/DynamicParser.h>

#include <sstream>

#include <folly/Optional.h>

namespace folly {

namespace {
folly::dynamic& insertAtKey(
    folly::dynamic* d,
    bool allow_non_string_keys,
    const folly::dynamic& key) {
  if (key.isString()) {
    return (*d)[key];
  } else if (key.isNumber() || key.isBool()) {
    // folly::dynamic allows non-null scalars for keys.
    return allow_non_string_keys ? (*d)[key] : (*d)[key.asString()];
  }
  // One cause might be oddness like p.optional(dynamic::array(...), ...);
  throw DynamicParserLogicError(
      "Unsupported key type ",
      key.typeName(),
      " of ",
      detail::toPseudoJson(key));
}
} // namespace

void DynamicParser::reportError(
    const folly::dynamic* lookup_k,
    const std::exception& ex) {
  // If descendants of this item, or other keys on it, already reported an
  // error, the error object would already exist.
  auto& e = stack_.errors(allowNonStringKeyErrors_);

  // Save the original, unparseable value of the item causing the error.
  //
  // value() can throw here, but if it does, it is due to programmer error,
  // so we don't want to report it as a parse error anyway.
  if (auto* e_val_ptr = e.get_ptr("value")) {
    // Failing to access distinct keys on the same value can generate
    // multiple errors, but the value should remain the same.
    if (*e_val_ptr != value()) {
      throw DynamicParserLogicError(
          "Overwriting value: ",
          detail::toPseudoJson(*e_val_ptr),
          " with ",
          detail::toPseudoJson(value()),
          " for error ",
          ex.what());
    }
  } else {
    // The e["value"].isNull() trick cannot be used because value().type()
    // *can* be folly::dynamic::Type::NULLT, so we must hash again.
    e["value"] = value();
  }

  // Differentiate between "parsing value" and "looking up key" errors.
  auto& e_msg = [&]() -> folly::dynamic& {
    if (lookup_k == nullptr) { // {object,array}Items, or post-key-lookup
      return e["error"];
    }
    // Multiple key lookups can report errors on the same collection.
    auto& key_errors = e["key_errors"];
    if (key_errors.isNull()) {
      // Treat arrays as integer-keyed objects.
      key_errors = folly::dynamic::object();
    }
    return insertAtKey(&key_errors, allowNonStringKeyErrors_, *lookup_k);
  }();
  if (!e_msg.isNull()) {
    throw DynamicParserLogicError(
        "Overwriting error: ",
        detail::toPseudoJson(e_msg),
        " with: ",
        ex.what());
  }
  e_msg = ex.what();

  switch (onError_) {
    case OnError::RECORD:
      break; // Continue parsing
    case OnError::THROW:
      stack_.throwErrors(); // Package releaseErrors() into an exception.
    default:
      LOG(FATAL) << "Bad onError_: " << static_cast<int>(onError_);
  }
}

void DynamicParser::ParserStack::Pop::operator()() noexcept {
  stackPtr_->key_ = key_;
  stackPtr_->value_ = value_;
  if (stackPtr_->unmaterializedSubErrorKeys_.empty()) {
    // There should be the current error, and the root.
    CHECK_GE(stackPtr_->subErrors_.size(), 2u)
        << "Internal bug: out of suberrors";
    stackPtr_->subErrors_.pop_back();
  } else {
    // Errors were never materialized for this subtree, so errors_ only has
    // ancestors of the item being processed.
    stackPtr_->unmaterializedSubErrorKeys_.pop_back();
    CHECK(!stackPtr_->subErrors_.empty()) << "Internal bug: out of suberrors";
  }
}

DynamicParser::ParserStack::PopGuard DynamicParser::ParserStack::push(
    const folly::dynamic& k,
    const folly::dynamic& v) noexcept {
  // Save the previous state of the parser.
  DynamicParser::ParserStack::PopGuard guard{this};
  key_ = &k;
  value_ = &v;
  // We create errors_ sub-objects lazily to keep the result small.
  unmaterializedSubErrorKeys_.emplace_back(key_);
  return guard;
}

// `noexcept` because if the materialization loop threw, we'd end up with
// more suberrors than we started with.
folly::dynamic& DynamicParser::ParserStack::errors(
    bool allow_non_string_keys) noexcept {
  // Materialize the lazy "key + parent's type" error objects we'll need.
  CHECK(!subErrors_.empty()) << "Internal bug: out of suberrors";
  for (const auto& suberror_key : unmaterializedSubErrorKeys_) {
    auto& nested = (*subErrors_.back())["nested"];
    if (nested.isNull()) {
      nested = folly::dynamic::object();
    }
    // Find, or insert a dummy entry for the current key
    auto& my_errors =
        insertAtKey(&nested, allow_non_string_keys, *suberror_key);
    if (my_errors.isNull()) {
      my_errors = folly::dynamic::object();
    }
    subErrors_.emplace_back(&my_errors);
  }
  unmaterializedSubErrorKeys_.clear();
  return *subErrors_.back();
}

folly::dynamic DynamicParser::ParserStack::releaseErrors() {
  if (key_ || unmaterializedSubErrorKeys_.size() != 0 ||
      subErrors_.size() != 1) {
    throw DynamicParserLogicError(
        "Do not releaseErrors() while parsing: ",
        key_ != nullptr,
        " / ",
        unmaterializedSubErrorKeys_.size(),
        " / ",
        subErrors_.size());
  }
  return releaseErrorsImpl();
}

[[noreturn]] void DynamicParser::ParserStack::throwErrors() {
  throw DynamicParserParseError(releaseErrorsImpl());
}

folly::dynamic DynamicParser::ParserStack::releaseErrorsImpl() {
  if (errors_.isNull()) {
    throw DynamicParserLogicError("Do not releaseErrors() twice");
  }
  auto errors = std::move(errors_);
  errors_ = nullptr; // Prevent a second release.
  value_ = nullptr; // Break attempts to parse again.
  return errors;
}

namespace detail {
std::string toPseudoJson(const folly::dynamic& d) {
  std::stringstream ss;
  ss << d;
  return ss.str();
}
} // namespace detail

} // namespace folly
