/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DebugStringConvertible.h"

#include <folly/Conv.h>
#include <folly/Format.h>

namespace facebook::react {

#if RN_DEBUG_STRING_CONVERTIBLE

std::string DebugStringConvertible::getDebugChildrenDescription(
    DebugStringConvertibleOptions options) const {
  if (options.depth >= options.maximumDepth) {
    return "";
  }

  options.depth++;

  auto trailing = options.format ? std::string{"\n"} : std::string{""};
  std::string childrenString;

  for (auto const &child : getDebugChildren()) {
    if (!child) {
      continue;
    }

    childrenString += child->getDebugDescription(options) + trailing;
  }

  if (!childrenString.empty() && !trailing.empty()) {
    // Removing trailing fragment.
    childrenString.erase(childrenString.end() - 1);
  }

  return childrenString;
}

std::string DebugStringConvertible::getDebugPropsDescription(
    DebugStringConvertibleOptions options) const {
  if (options.depth >= options.maximumDepth) {
    return "";
  }

  options.depth++;

  std::string propsString;

  for (auto const &prop : getDebugProps()) {
    if (!prop) {
      continue;
    }

    auto name = prop->getDebugName();
    auto value = prop->getDebugValue();
    auto children = prop->getDebugPropsDescription(options);
    auto valueAndChildren =
        value + (children.empty() ? "" : "(" + children + ")");
    propsString +=
        " " + name + (valueAndChildren.empty() ? "" : "=" + valueAndChildren);
  }

  if (!propsString.empty()) {
    // Removing leading space character.
    propsString.erase(propsString.begin());
  }

  return propsString;
}

std::string DebugStringConvertible::getDebugDescription(
    DebugStringConvertibleOptions options) const {
  auto nameString = getDebugName();
  auto valueString = getDebugValue();

  // Convention:
  // If `name` and `value` are empty, `description` is also empty.
  if (nameString.empty() && valueString.empty()) {
    return "";
  }

  // Convention:
  // If `name` is empty and `value` isn't empty, `description` equals `value`.
  if (nameString.empty()) {
    return valueString;
  }

  auto childrenString = getDebugChildrenDescription(options);
  auto propsString = getDebugPropsDescription(options);

  auto leading =
      options.format ? std::string(options.depth * 2, ' ') : std::string{""};
  auto trailing = options.format ? std::string{"\n"} : std::string{""};

  return leading + "<" + nameString +
      (valueString.empty() ? "" : "=" + valueString) +
      (propsString.empty() ? "" : " " + propsString) +
      (childrenString.empty() ? "/>"
                              : ">" + trailing + childrenString + trailing +
               leading + "</" + nameString + ">");
}

std::string DebugStringConvertible::getDebugName() const {
  return "Node";
}

std::string DebugStringConvertible::getDebugValue() const {
  return "";
}

SharedDebugStringConvertibleList DebugStringConvertible::getDebugChildren()
    const {
  return {};
}

SharedDebugStringConvertibleList DebugStringConvertible::getDebugProps() const {
  return {};
}

/*
 * `toString`-family implementation.
 */
std::string toString(std::string const &value) {
  return value;
}
std::string toString(int const &value) {
  return folly::to<std::string>(value);
}
std::string toString(bool const &value) {
  return folly::to<std::string>(value);
}
std::string toString(float const &value) {
  return folly::to<std::string>(value);
}
std::string toString(double const &value) {
  return folly::to<std::string>(value);
}
std::string toString(void const *value) {
  if (value == nullptr) {
    return "null";
  }
  return folly::sformat("0x{0:016x}", reinterpret_cast<size_t>(value));
}

#endif

} // namespace facebook::react
