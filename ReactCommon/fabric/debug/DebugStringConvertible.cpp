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
    DebugStringConvertibleOptions options,
    int depth) const {
  if (depth >= options.maximumDepth) {
    return "";
  }

  std::string childrenString = "";

  for (auto child : getDebugChildren()) {
    if (!child) {
      continue;
    }

    childrenString += child->getDebugDescription(options, depth + 1);
  }

  return childrenString;
}

std::string DebugStringConvertible::getDebugPropsDescription(
    DebugStringConvertibleOptions options,
    int depth) const {
  if (depth >= options.maximumDepth) {
    return "";
  }

  std::string propsString = "";

  for (auto prop : getDebugProps()) {
    if (!prop) {
      continue;
    }

    auto name = prop->getDebugName();
    auto value = prop->getDebugValue();
    auto children = prop->getDebugPropsDescription(options, depth + 1);
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
    DebugStringConvertibleOptions options,
    int depth) const {
  auto nameString = getDebugName();
  auto valueString = getDebugValue();
  auto childrenString = getDebugChildrenDescription(options, depth);
  auto propsString = getDebugPropsDescription(options, depth);

  auto leading = options.format ? std::string(depth * 2, ' ') : std::string{""};
  auto trailing = options.format ? std::string{"\n"} : std::string{""};

  return leading + "<" + nameString +
      (valueString.empty() ? "" : "=" + valueString) +
      (propsString.empty() ? "" : " " + propsString) +
      (childrenString.empty() ? "/>" + trailing
                              : ">" + trailing + childrenString + leading +
               "</" + nameString + ">" + trailing);
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
