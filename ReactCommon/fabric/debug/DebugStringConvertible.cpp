/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DebugStringConvertible.h"

namespace facebook {
namespace react {

#if RN_DEBUG_STRING_CONVERTIBLE

std::string DebugStringConvertible::getDebugChildrenDescription(
    DebugStringConvertibleOptions options) const {
  if (options.depth >= options.maximumDepth) {
    return "";
  }

  options.depth++;

  auto trailing = options.format ? std::string{"\n"} : std::string{""};
  auto childrenString = std::string{""};

  for (auto child : getDebugChildren()) {
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

  auto propsString = std::string{""};

  for (auto prop : getDebugProps()) {
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
  return SharedDebugStringConvertibleList();
}

SharedDebugStringConvertibleList DebugStringConvertible::getDebugProps() const {
  return SharedDebugStringConvertibleList();
}

#endif

} // namespace react
} // namespace facebook
