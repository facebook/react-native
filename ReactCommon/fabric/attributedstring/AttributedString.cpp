/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AttributedString.h"

#include <fabric/debug/DebugStringConvertibleItem.h>

namespace facebook {
namespace react {

using Fragment = AttributedString::Fragment;
using Fragments = AttributedString::Fragments;

void AttributedString::appendFragment(const Fragment &fragment) {
  ensureUnsealed();
  fragments_.push_back(fragment);
}

void AttributedString::prependFragment(const Fragment &fragment) {
  ensureUnsealed();
  fragments_.insert(fragments_.begin(), fragment);
}

void AttributedString::appendAttributedString(const AttributedString &attributedString) {
  ensureUnsealed();
  fragments_.insert(fragments_.end(), attributedString.fragments_.begin(), attributedString.fragments_.end());
}

void AttributedString::prependAttributedString(const AttributedString &attributedString) {
  ensureUnsealed();
  fragments_.insert(fragments_.begin(), attributedString.fragments_.begin(), attributedString.fragments_.end());
}

const std::vector<Fragment> &AttributedString::getFragments() const {
  return fragments_;
}

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList AttributedString::getDebugChildren() const {
  SharedDebugStringConvertibleList list = {};

  for (auto &&fragment : fragments_) {
    auto propsList = fragment.textAttributes.DebugStringConvertible::getDebugProps();

    if (fragment.shadowNode) {
      propsList.push_back(std::make_shared<DebugStringConvertibleItem>("shadowNode", fragment.shadowNode->getDebugDescription()));
    }

    list.push_back(
      std::make_shared<DebugStringConvertibleItem>(
        "Fragment",
        fragment.string,
        SharedDebugStringConvertibleList(),
        propsList
      )
    );
  }

  return list;
}

} // namespace react
} // namespace facebook
