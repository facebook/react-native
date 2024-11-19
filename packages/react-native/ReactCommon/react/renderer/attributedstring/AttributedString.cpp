/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AttributedString.h"

#include <react/renderer/debug/DebugStringConvertibleItem.h>

namespace facebook::react {

using Fragment = AttributedString::Fragment;
using Fragments = AttributedString::Fragments;

#pragma mark - Fragment

std::string Fragment::AttachmentCharacter() {
  // C++20 makes char8_t a distinct type from char, and u8 string literals
  // consist of char8_t instead of char, which in turn requires std::u8string,
  // etc. Here we were assuming char was UTF-8 anyway, so just cast to that
  // (which is valid because char* is allowed to alias anything).
  return reinterpret_cast<const char*>(
      u8"\uFFFC"); // Unicode `OBJECT REPLACEMENT CHARACTER`
}

bool Fragment::isAttachment() const {
  return string == AttachmentCharacter();
}

bool Fragment::operator==(const Fragment& rhs) const {
  return std::tie(
             string,
             textAttributes,
             parentShadowView.tag,
             parentShadowView.layoutMetrics) ==
      std::tie(
             rhs.string,
             rhs.textAttributes,
             rhs.parentShadowView.tag,
             rhs.parentShadowView.layoutMetrics);
}

bool Fragment::isContentEqual(const Fragment& rhs) const {
  return std::tie(string, textAttributes) ==
      std::tie(rhs.string, rhs.textAttributes);
}

bool Fragment::operator!=(const Fragment& rhs) const {
  return !(*this == rhs);
}

#pragma mark - AttributedString

void AttributedString::appendFragment(Fragment&& fragment) {
  ensureUnsealed();
  if (!fragment.string.empty()) {
    fragments_.push_back(std::move(fragment));
  }
}

void AttributedString::prependFragment(Fragment&& fragment) {
  ensureUnsealed();
  if (!fragment.string.empty()) {
    fragments_.insert(fragments_.begin(), std::move(fragment));
  }
}

void AttributedString::setBaseTextAttributes(
    const TextAttributes& defaultAttributes) {
  baseAttributes_ = defaultAttributes;
}

const Fragments& AttributedString::getFragments() const {
  return fragments_;
}

Fragments& AttributedString::getFragments() {
  return fragments_;
}

std::string AttributedString::getString() const {
  auto string = std::string{};
  for (const auto& fragment : fragments_) {
    string += fragment.string;
  }
  return string;
}

const TextAttributes& AttributedString::getBaseTextAttributes() const {
  return baseAttributes_;
}

bool AttributedString::isEmpty() const {
  return fragments_.empty();
}

bool AttributedString::compareTextAttributesWithoutFrame(
    const AttributedString& rhs) const {
  if (fragments_.size() != rhs.fragments_.size()) {
    return false;
  }

  for (size_t i = 0; i < fragments_.size(); i++) {
    if (fragments_[i].textAttributes != rhs.fragments_[i].textAttributes ||
        fragments_[i].string != rhs.fragments_[i].string) {
      return false;
    }
  }

  return true;
}

bool AttributedString::operator==(const AttributedString& rhs) const {
  return fragments_ == rhs.fragments_;
}

bool AttributedString::operator!=(const AttributedString& rhs) const {
  return !(*this == rhs);
}

bool AttributedString::isContentEqual(const AttributedString& rhs) const {
  if (fragments_.size() != rhs.fragments_.size()) {
    return false;
  }

  for (size_t i = 0; i < fragments_.size(); i++) {
    if (!fragments_[i].isContentEqual(rhs.fragments_[i])) {
      return false;
    }
  }

  return true;
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList AttributedString::getDebugChildren() const {
  auto list = SharedDebugStringConvertibleList{};

  for (auto&& fragment : fragments_) {
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

} // namespace facebook::react
