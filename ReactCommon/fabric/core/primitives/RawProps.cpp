/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawProps.h"

#include <react/core/RawPropsParser.h>

namespace facebook {
namespace react {

RawProps::RawProps() {
  mode_ = Mode::Empty;
}

/*
 * Creates an object with given `runtime` and `value`.
 */
RawProps::RawProps(jsi::Runtime &runtime, jsi::Value const &value) noexcept {
  if (value.isNull()) {
    mode_ = Mode::Empty;
    return;
  }

  mode_ = mode_ = Mode::JSI;
  runtime_ = &runtime;
  value_ = jsi::Value(runtime, value);
}

/*
 * Creates an object with given `folly::dynamic` object.
 * Deprecated. Do not use.
 * We need this temporary, only because we have a callsite that does not have
 * a `jsi::Runtime` behind the data.
 */
RawProps::RawProps(folly::dynamic const &dynamic) noexcept {
  if (dynamic.isNull()) {
    mode_ = Mode::Empty;
    return;
  }

  mode_ = Mode::Dynamic;
  dynamic_ = dynamic;
}

void RawProps::parse(RawPropsParser const &parser) const noexcept {
  assert(parser_ == nullptr && "A parser was already assigned.");
  parser_ = &parser;
  parser.preparse(*this);
}

/*
 * Deprecated. Do not use.
 * The support for explicit conversion to `folly::dynamic` is deprecated and
 * will be removed as soon Android implementation does not need it.
 */
RawProps::operator folly::dynamic() const noexcept {
  switch (mode_) {
    case Mode::Empty:
      return folly::dynamic::object();
    case Mode::JSI:
      return jsi::dynamicFromValue(*runtime_, value_);
    case Mode::Dynamic:
      return dynamic_;
  }
}

/*
 * Returns `true` if the object is empty.
 * Empty `RawProps` does not have any stored data.
 */
bool RawProps::isEmpty() const noexcept {
  return mode_ == Mode::Empty;
}

/*
 * Returns a const unowning pointer to `RawValue` of a prop with a given name.
 * Returns `nullptr` if a prop with the given name does not exist.
 */
const RawValue *RawProps::at(
    char const *name,
    char const *prefix,
    char const *suffix) const noexcept {
  assert(
      parser_ &&
      "The object is not parsed. `parse` must be called before `at`.");
  return parser_->at(*this, RawPropsKey{prefix, name, suffix});
}

} // namespace react
} // namespace facebook
