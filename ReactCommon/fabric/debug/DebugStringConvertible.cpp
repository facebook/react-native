/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DebugStringConvertible.h"

namespace facebook {
namespace react {

std::string DebugStringConvertible::getDebugChildrenDescription(int level) const {
  std::string childrenString = "";

  for (auto child : getDebugChildren()) {
    childrenString += child->getDebugDescription(level + 1);
  }

  return childrenString;
}

std::string DebugStringConvertible::getDebugPropsDescription(int level) const {
  std::string propsString = "";

  for (auto prop : getDebugProps()) {
    auto name = prop->getDebugName();
    auto value = prop->getDebugValue();
    auto children = prop->getDebugPropsDescription(level + 1);
    auto valueAndChildren = value + (children.empty() ? "" : "(" + children + ")");
    propsString += " " + name + (valueAndChildren.empty() ? "" : "=" + valueAndChildren);
  }

  if (!propsString.empty()) {
    // Removing leading space character.
    propsString.erase(propsString.begin());
  }

  return propsString;
}

std::string DebugStringConvertible::getDebugDescription(int level) const {
  std::string nameString = getDebugName();
  std::string valueString = getDebugValue();
  std::string childrenString = getDebugChildrenDescription(level);
  std::string propsString = getDebugPropsDescription(level);

  return "<" + nameString +
    (valueString.empty() ? "" : "=" + valueString) +
    (propsString.empty() ? "" : " " + propsString) +
    (childrenString.empty() ? "/>" : ">" + childrenString + "</" + nameString + ">");
}

std::string DebugStringConvertible::getDebugName() const {
  return "Node";
}

std::string DebugStringConvertible::getDebugValue() const {
  return "";
}

SharedDebugStringConvertibleList DebugStringConvertible::getDebugChildren() const {
  return SharedDebugStringConvertibleList();
}

SharedDebugStringConvertibleList DebugStringConvertible::getDebugProps() const {
  return SharedDebugStringConvertibleList();
}

} // namespace react
} // namespace facebook
