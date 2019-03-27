/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AttributedString.h"

#include <react/debug/DebugStringConvertibleItem.h>

namespace facebook {
namespace react {

using Fragment = AttributedString::Fragment;
using Fragments = AttributedString::Fragments;

#pragma mark - Fragment

bool Fragment::operator==(const Fragment &rhs) const {
  return std::tie(string, textAttributes, shadowView, parentShadowView) ==
      std::tie(
             rhs.string,
             rhs.textAttributes,
             rhs.shadowView,
             rhs.parentShadowView);
}

bool Fragment::operator!=(const Fragment &rhs) const {
  return !(*this == rhs);
}

#pragma mark - AttributedString

void AttributedString::appendFragment(const Fragment &fragment) {
  ensureUnsealed();

  if (fragment.string.empty()) {
    return;
  }

  fragments_.push_back(fragment);
}

void AttributedString::prependFragment(const Fragment &fragment) {
  ensureUnsealed();

  if (fragment.string.empty()) {
    return;
  }

  fragments_.insert(fragments_.begin(), fragment);
}

void AttributedString::appendAttributedString(
    const AttributedString &attributedString) {
  ensureUnsealed();
  fragments_.insert(
      fragments_.end(),
      attributedString.fragments_.begin(),
      attributedString.fragments_.end());
}

void AttributedString::prependAttributedString(
    const AttributedString &attributedString) {
  ensureUnsealed();
  fragments_.insert(
      fragments_.begin(),
      attributedString.fragments_.begin(),
      attributedString.fragments_.end());
}

const Fragments &AttributedString::getFragments() const {
  return fragments_;
}

std::string AttributedString::getString() const {
  auto string = std::string{};
  for (const auto &fragment : fragments_) {
    string += fragment.string;
  }
  return string;
}

bool AttributedString::isEmpty() const {
  return fragments_.empty();
}

bool AttributedString::operator==(const AttributedString &rhs) const {
  return fragments_ == rhs.fragments_;
}

bool AttributedString::operator!=(const AttributedString &rhs) const {
  return !(*this == rhs);
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList AttributedString::getDebugChildren() const {
  auto list = SharedDebugStringConvertibleList{};

  for (auto &&fragment : fragments_) {
    auto propsList =
        fragment.textAttributes.DebugStringConvertible::getDebugProps();

    list.push_back(std::make_shared<DebugStringConvertibleItem>(
        "Fragment",
        fragment.string,
        SharedDebugStringConvertibleList(),
        propsList));
  }

  return list;
}
#endif

} // namespace react
} // namespace facebook
