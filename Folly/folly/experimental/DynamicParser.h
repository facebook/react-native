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

#include <folly/CPortability.h>
#include <folly/ScopeGuard.h>
#include <folly/dynamic.h>

namespace folly {

/**
 * DynamicParser provides a tiny DSL for easily, correctly, and losslessly
 * parsing a folly::dynamic into any other representation.
 *
 * To make this concrete, this lets you take a JSON config that potentially
 * contains user errors, and parse __all__ of its valid parts, while
 * automatically and __reversibly__ recording any parts that cause errors:
 *
 *   {"my values": {
 *     "an int": "THIS WILL BE RECORDED AS AN ERROR, BUT WE'LL PARSE THE REST",
 *     "a double": 3.1415,
 *     "keys & values": {
 *       "the sky is blue": true,
 *       "THIS WILL ALSO BE RECORDED AS AN ERROR": "cheese",
 *       "2+2=5": false,
 *     }
 *   }}
 *
 * To parse this JSON, you need no exception handling, it is as easy as:
 *
 *   folly::dynamic d = ...;  // Input
 *   int64_t integer;  // Three outputs
 *   double real;
 *   std::map<std::string, bool> enabled_widgets;
 *   DynamicParser p(DynamicParser::OnError::RECORD, &d);
 *   p.required("my values", [&]() {
 *     p.optional("an int", [&](int64_t v) { integer = v; });
 *     p.required("a double", [&](double v) { real = v; });
 *     p.optional("keys & values", [&]() {
 *       p.objectItems([&](std::string widget, bool enabled) {
 *         enabled_widgets.emplace(widget, enabled);
 *       });
 *     });
 *   });
 *
 * Your code in the lambdas can throw, and this will be reported just like
 * missing key and type conversion errors, with precise context on what part
 * of the folly::dynamic caused the error.  No need to throw:
 *   std::runtime_error("Value X at key Y caused a flux capacitor overload")
 * This will do:
 *   std::runtime_error("Flux capacitor overload")
 *
 * == Keys and values are auto-converted to match your callback ==
 *
 * DynamicParser's optional(), required(), objectItems(), and
 * arrayItems() automatically convert the current key and value to match the
 * signature of the provided callback.  parser.key() and parser.value() can
 * be used to access the same data without conversion.
 *
 * The following types are supported -- you should generally take arguments
 * by-value, or by-const-reference for dynamics & strings you do not copy.
 *
 *   Key: folly::dynamic (no conversion), std::string, int64_t
 *   Value: folly::dynamic (no conversion), int64_t, bool, double, std::string
 *
 * There are 21 supported callback signatures, of three kinds:
 *
 *   1: No arguments -- useful if you will just call more parser methods.
 *
 *   5: The value alone -- the common case for optional() and required().
 *        [&](whatever_t value) {}
 *
 *   15: Both the key and the value converted according to the rules above:
 *        [&](whatever_t key, whatever_t) {}
 *
 * NB: The key alone should be rarely needed, but these callback styles
 *     provide it with no conversion overhead, and only minimal verbosity:
 *       [&](const std::string& k, const folly::dynamic&) {}
 *       [&]() { auto k = p.key().asString(); }
 *
 * == How `releaseErrors()` can make your parse lossless ==
 *
 * If you write parsing code by hand, you usually end up with error-handling
 * resembling that of OnError::THROW -- the first error you hit aborts the
 * whole parse, and you report it.
 *
 * OnError::RECORD offers a more user-friendly alternative for "parse,
 * serialize, re-parse" pipelines, akin to what web-forms do.  All
 * exception-causing parts are losslessly recorded in a parallel
 * folly::dynamic, available via releaseErrors() at the end of the parse.
 *
 * Suppose we fail to look up "key1" at the root, and hit a value error in
 * "key2": {"subkey2": ...}.  The error report will have the form:
 *
 *   {"nested": {
 *     "key_errors": {"key1": "explanatory message"},
 *     "value": <whole input>,
 *     "nested": { "key2": { "nested": {
 *       "subkey2": {"value": <original value>, "error": "message"}
 *     } } }
 *   }}
 *
 * Errors in array items are handled just the same, but using integer keys.
 *
 * The advantage of this approach is that your parsing can throw wherever,
 * and DynamicParser isolates it, allowing the good parts to parse.
 *
 * Put another way, this makes it easy to implement a transformation that
 * splits a `folly::dynamic` into a "parsed" part (which might be your
 * struct meant for runtime use), and a matching "errors" part.  As long as
 * your successful parses are lossless, you can always reconstruct the
 * original input from the parse output and the recorded "errors".
 *
 * == Limitations ==
 *
 *  - The input dynamic should be an object or array. wrapError() could be
 *    exposed to allow parsing single scalars, but this would not be a
 *    significant usability improvement over try-catch.
 *
 *  - Do NOT try to parse the same part of the input dynamic twice. You
 *    might report multiple value errors, which is currently unsupported.
 *
 *  - optional() does not support defaulting. This is unavoidable, since
 *    DynamicParser does not dictate how you record parsed data.  If your
 *    parse writes into an output struct, then it ought to be initialized at
 *    construction time.  If your output is initialized to default values,
 *    then you need no "default" feature.  If it is not initialized, you are
 *    in trouble anyway.  Suppose your optional() parse hits an error.  What
 *    does your output contain?
 *      - Uninitialized data :(
 *      - You rely on an optional() feature to fall back to parsing some
 *        default dynamic.  Sadly, the default hits a parse error.  Now what?
 *    Since there is no good way to default, DynamicParser leaves it out.
 *
 * == Future: un-parsed items ==
 *
 * DynamicParser could support erroring on un-parsed items -- the parts of
 * the folly::dynamic, which were never asked for.  Here is an ok design:
 *
 * (i) At the start of parsing any value, the user may call:
 *   parser.recursivelyForbidUnparsed();
 *   parser.recursivelyAllowUnparsed();
 *   parser.locallyForbidUnparsed();
 *   parser.locallyAllowUnparsed();
 *
 * (ii) At the end of the parse, any unparsed items are dumped to "errors".
 * For example, failing to parse index 1 out of ["v1", "v2", "v3"] yields:
 *   "nested": {1: {"unparsed": "v2"}}
 * or perhaps more verbosely:
 *   "nested": {1: {"error": "unparsed value", "value": "v2"}}
 *
 * By default, unparsed items are allowed. Calling a "forbid" function after
 * some keys have already been parsed is allowed to fail (this permits a
 * lazy implementation, which has minimal overhead when "forbid" is not
 * requested).
 *
 * == Future: multiple value errors ==
 *
 * The present contract is that exactly one value error is reported per
 * location in the input (multiple key lookup errors are, of course,
 * supported).  If the need arises, multiple value errors could easily be
 * supported by replacing the "error" string with an "errors" array.
 */

namespace detail {
// Why do DynamicParser error messages use folly::dynamic pseudo-JSON?
// Firstly, the input dynamic need not correspond to valid JSON.  Secondly,
// wrapError() uses integer-keyed objects to report arrary-indexing errors.
std::string toPseudoJson(const folly::dynamic& d);
} // namespace detail

/**
 * With DynamicParser::OnError::THROW, reports the first error.
 * It is forbidden to call releaseErrors() if you catch this.
 */
struct FOLLY_EXPORT DynamicParserParseError : public std::runtime_error {
  explicit DynamicParserParseError(folly::dynamic error)
      : std::runtime_error(folly::to<std::string>(
            "DynamicParserParseError: ",
            detail::toPseudoJson(error))),
        error_(std::move(error)) {}
  /**
   * Structured just like releaseErrors(), but with only 1 error inside:
   *   {"nested": {"key1": {"nested": {"key2": {"error": "err", "value": 5}}}}}
   * or:
   *   {"nested": {"key1": {"key_errors": {"key3": "err"}, "value": 7}}}
   */
  const folly::dynamic& error() const {
    return error_;
  }

 private:
  folly::dynamic error_;
};

/**
 * When DynamicParser is used incorrectly, it will throw this exception
 * instead of reporting an error via releaseErrors().  It is unsafe to call
 * any parser methods after catching a LogicError.
 */
struct FOLLY_EXPORT DynamicParserLogicError : public std::logic_error {
  template <typename... Args>
  explicit DynamicParserLogicError(Args&&... args)
      : std::logic_error(folly::to<std::string>(std::forward<Args>(args)...)) {}
};

class DynamicParser {
 public:
  enum class OnError {
    // After parsing, releaseErrors() reports all parse errors.
    // Throws DynamicParserLogicError on programmer errors.
    RECORD,
    // Throws DynamicParserParseError on the first parse error, or
    // DynamicParserLogicError on programmer errors.
    THROW,
  };

  // You MUST NOT destroy `d` before the parser.
  DynamicParser(OnError on_error, const folly::dynamic* d)
      : onError_(on_error), stack_(d) {} // Always access input through stack_

  /**
   * Once you finished the entire parse, returns a structured description of
   * all parse errors (see top-of-file docblock).  May ONLY be called once.
   * May NOT be called if the parse threw any kind of exception.  Returns an
   * empty object for successful OnError::THROW parsers.
   */
  folly::dynamic releaseErrors() {
    return stack_.releaseErrors();
  }

  /**
   * Error-wraps fn(auto-converted key & value) if d[key] is set. The
   * top-of-file docblock explains the auto-conversion.
   */
  template <typename Fn>
  void optional(const folly::dynamic& key, Fn);

  // Like optional(), but reports an error if d[key] does not exist.
  template <typename Fn>
  void required(const folly::dynamic& key, Fn);

  /**
   * Iterate over the current object's keys and values. Report each item's
   * errors under its own key in a matching sub-object of "errors".
   */
  template <typename Fn>
  void objectItems(Fn);

  /**
   * Like objectItems() -- arrays are treated identically to objects with
   * integer keys from 0 to size() - 1.
   */
  template <typename Fn>
  void arrayItems(Fn);

  /**
   * The key currently being parsed (integer if inside an array). Throws if
   * called outside of a parser callback.
   */
  inline const folly::dynamic& key() const {
    return stack_.key();
  }
  /**
   * The value currently being parsed (initially, the input dynamic).
   * Throws if parsing nullptr, or parsing after releaseErrors().
   */
  inline const folly::dynamic& value() const {
    return stack_.value();
  }

  /**
   * By default, DynamicParser's "nested" object coerces all keys to
   * strings, whether from arrayItems() or from p.optional(some_int, ...),
   * to allow errors be serialized to JSON.  If you are parsing non-JSON
   * dynamic objects with non-string keys, this is problematic.  When set to
   * true, "nested" objects will report integer keys for errors coming from
   * inside arrays, or the original key type from inside values of objects.
   */
  DynamicParser& setAllowNonStringKeyErrors(bool b) {
    allowNonStringKeyErrors_ = b;
    return *this;
  }

 private:
  /**
   * If `fn` throws an exception, wrapError() catches it and inserts an
   * enriched description into stack_.errors_.  If lookup_key is non-null,
   * reports a key lookup error in "key_errors", otherwise reportse a value
   * error in "error".
   *
   * Not public because that would encourage users to report multiple errors
   * per input part, which is currently unsupported.  It does not currently
   * seem like normal user code should need this.
   */
  template <typename Fn>
  void wrapError(const folly::dynamic* lookup_key, Fn);

  void reportError(const folly::dynamic* lookup_k, const std::exception& ex);

  template <typename Fn>
  void parse(const folly::dynamic& key, const folly::dynamic& value, Fn fn);

  // All of the above business logic obtains the part of the folly::dynamic
  // it is examining (and the location for reporting errors) via this class,
  // which lets it correctly handle nesting.
  struct ParserStack {
    struct Pop {
      explicit Pop(ParserStack* sp)
          : key_(sp->key_), value_(sp->value_), stackPtr_(sp) {}
      void operator()() noexcept; // ScopeGuard requires noexcept
     private:
      const folly::dynamic* key_;
      const folly::dynamic* value_;
      ParserStack* stackPtr_;
    };
    struct PopGuard {
      explicit PopGuard(ParserStack* sp) : pop_(in_place, sp) {}
      ~PopGuard() {
        pop_ && ((*pop_)(), true);
      }

     private:
      Optional<Pop> pop_;
    };

    explicit ParserStack(const folly::dynamic* input)
        : value_(input),
          errors_(folly::dynamic::object()),
          subErrors_({&errors_}) {}

    // Not copiable or movable due to numerous internal pointers
    ParserStack(const ParserStack&) = delete;
    ParserStack& operator=(const ParserStack&) = delete;
    ParserStack(ParserStack&&) = delete;
    ParserStack& operator=(ParserStack&&) = delete;

    // Lets user code nest parser calls by recording current key+value and
    // returning an RAII guard to restore the old one.  `noexcept` since it
    // is used unwrapped.
    PopGuard push(const folly::dynamic& k, const folly::dynamic& v) noexcept;

    // Throws DynamicParserLogicError if used outside of a parsing function.
    inline const folly::dynamic& key() const;
    // Throws DynamicParserLogicError if used after releaseErrors().
    inline const folly::dynamic& value() const;

    // Lazily creates new "nested" sub-objects in errors_.
    folly::dynamic& errors(bool allow_non_string_keys) noexcept;

    // The user invokes this at most once after the parse is done.
    folly::dynamic releaseErrors();

    // Invoked on error when using OnError::THROW.
    [[noreturn]] void throwErrors();

   private:
    friend struct Pop;

    folly::dynamic releaseErrorsImpl(); // for releaseErrors() & throwErrors()

    // Null outside of a parsing function.
    const folly::dynamic* key_{nullptr};
    // Null on errors: when the input was nullptr, or after releaseErrors().
    const folly::dynamic* value_;

    // An object containing some of these keys:
    //   "key_errors" -- {"key": "description of error looking up said key"}
    //   "error" -- why did we fail to parse this value?
    //   "value" -- a copy of the input causing the error, and
    //   "nested" -- {"key" or integer for arrays: <another errors_ object>}
    //
    // "nested" will contain identically structured objects with keys (array
    // indices) identifying the origin of the errors.  Of course, "input"
    // would no longer refer to the whole input, but to a part.
    folly::dynamic errors_;
    // We only materialize errors_ sub-objects when needed. This stores keys
    // for unmaterialized errors, from outermost to innermost.
    std::vector<const folly::dynamic*> unmaterializedSubErrorKeys_;
    // Materialized errors, from outermost to innermost
    std::vector<folly::dynamic*> subErrors_; // Point into errors_
  };

  OnError onError_;
  ParserStack stack_;
  bool allowNonStringKeyErrors_{false}; // See the setter's docblock.
};

} // namespace folly

#include <folly/experimental/DynamicParser-inl.h>
