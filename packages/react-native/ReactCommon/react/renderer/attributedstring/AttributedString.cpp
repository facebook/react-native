/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AttributedString.h"

#include <react/renderer/debug/DebugStringConvertibleItem.h>

namespace facebook::react {

using TextFragment = AttributedString::TextFragment;
using Fragments = AttributedString::Fragments;

#pragma mark - TextFragment

std::string TextFragment::AttachmentCharacter() {
  // C++20 makes char8_t a distinct type from char, and u8 string literals
  // consist of char8_t instead of char, which in turn requires std::u8string,
  // etc. Here we were assuming char was UTF-8 anyway, so just cast to that
  // (which is valid because char* is allowed to alias anything).
  return reinterpret_cast<const char*>(
      u8"\uFFFC"); // Unicode `OBJECT REPLACEMENT CHARACTER`
}

bool TextFragment::isAttachment() const {
  return string == AttachmentCharacter();
}

bool TextFragment::operator==(const TextFragment& rhs) const {
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

bool TextFragment::isContentEqual(const TextFragment& rhs) const {
  return std::tie(string, textAttributes) ==
      std::tie(rhs.string, rhs.textAttributes);
}

bool TextFragment::operator!=(const TextFragment& rhs) const {
  return !(*this == rhs);
}

#pragma mark - AttributedString

AttributedString::FragmentHandle AttributedString::appendTextFragment(
    const TextFragment& textFragment) {
  ensureUnsealed();

  if (!textFragment.string.empty()) {
    fragments_.push_back(textFragment);
  }

  return AttributedString::FragmentHandle{fragments_.size() - 1};
}

void AttributedString::prependTextFragment(const TextFragment& textFragment) {
  ensureUnsealed();

  if (textFragment.string.empty()) {
    return;
  }

  fragments_.insert(fragments_.begin(), textFragment);
}

void AttributedString::appendAttributedString(
    const AttributedString& attributedString) {
  ensureUnsealed();
  fragments_.insert(
      fragments_.end(),
      attributedString.fragments_.begin(),
      attributedString.fragments_.end());
}

void AttributedString::prependAttributedString(
    const AttributedString& attributedString) {
  ensureUnsealed();
  fragments_.insert(
      fragments_.begin(),
      attributedString.fragments_.begin(),
      attributedString.fragments_.end());
}

const Fragments& AttributedString::getFragments() const {
  return fragments_;
}

Fragments& AttributedString::getFragments() {
  return fragments_;
}

TextFragment& AttributedString::getFragment(
    AttributedString::FragmentHandle handle) {
  return fragments_[handle.fragmentIndex];
}

const TextFragment& AttributedString::getFragment(
    AttributedString::FragmentHandle handle) const {
  return fragments_[handle.fragmentIndex];
}

std::string AttributedString::getString() const {
  auto string = std::string{};
  for (const auto& textFragment : fragments_) {
    string += textFragment.string;
  }
  return string;
}

bool AttributedString::isEmpty() const {
  return fragments_.empty();
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

  for (auto&& textFragment : fragments_) {
    auto propsList =
        textFragment.textAttributes.DebugStringConvertible::getDebugProps();

    list.push_back(std::make_shared<DebugStringConvertibleItem>(
        "TextFragment",
        textFragment.string,
        SharedDebugStringConvertibleList(),
        propsList));
  }

  return list;
}
#endif

} // namespace facebook::react
