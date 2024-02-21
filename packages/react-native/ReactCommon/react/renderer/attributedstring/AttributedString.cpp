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
using TextFragment = AttributedString::TextFragment;
using SpanFragment = AttributedString::SpanFragment;
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

#pragma mark - SpanFragment

bool SpanFragment::operator==(const SpanFragment& rhs) const {
  return std::tie(spanAttributes, attributedSubstring) ==
      std::tie(rhs.spanAttributes, attributedSubstring);
}

bool SpanFragment::isContentEqual(const SpanFragment& rhs) const {
  return spanAttributes == rhs.spanAttributes &&
      attributedSubstring.isContentEqual(rhs.attributedSubstring);
}

bool SpanFragment::operator!=(const SpanFragment& rhs) const {
  return !(*this == rhs);
}

#pragma mark - Fragment

Fragment::Kind Fragment::getKind() const {
  return (Kind)variant_.index();
}

TextFragment& Fragment::asText() {
  return std::get<TextFragment>(variant_);
}

const TextFragment& Fragment::asText() const {
  return std::get<TextFragment>(variant_);
}

SpanFragment& Fragment::asSpan() {
  return std::get<SpanFragment>(variant_);
}

const SpanFragment& Fragment::asSpan() const {
  return std::get<SpanFragment>(variant_);
}

bool Fragment::operator==(const Fragment& rhs) const {
  if (getKind() == Fragment::Kind::Text &&
      rhs.getKind() == Fragment::Kind::Text) {
    return asText() == rhs.asText();
  } else if (
      getKind() == Fragment::Kind::Span &&
      rhs.getKind() == Fragment::Kind::Span) {
    return asSpan() == rhs.asSpan();
  } else {
    return false;
  }
}

bool Fragment::isContentEqual(const Fragment& rhs) const {
  if (getKind() == Fragment::Kind::Text &&
      rhs.getKind() == Fragment::Kind::Text) {
    return asText().isContentEqual(rhs.asText());
  } else if (
      getKind() == Fragment::Kind::Span &&
      rhs.getKind() == Fragment::Kind::Span) {
    return asSpan().isContentEqual(rhs.asSpan());
  } else {
    return false;
  }
}

bool Fragment::operator!=(const Fragment& rhs) const {
  return !(*this == rhs);
}

#pragma mark - FragmentHandle

AttributedString::FragmentHandle AttributedString::FragmentHandle::nil =
    FragmentHandle{{}};

#pragma mark - AttributedString

AttributedString::FragmentHandle AttributedString::appendFragment(
    const Fragment& fragment) {
  ensureUnsealed();

  fragments_.push_back(fragment);

  return AttributedString::FragmentHandle{{fragments_.size() - 1}};
}

AttributedString::FragmentHandle AttributedString::appendSpanFragment(
    const SpanFragment& spanFragment) {
  return appendFragment(Fragment{spanFragment});
}

AttributedString::FragmentHandle AttributedString::appendTextFragment(
    const TextFragment& textFragment) {
  return appendFragment(Fragment{textFragment});
}

void AttributedString::prependTextFragment(const TextFragment& textFragment) {
  ensureUnsealed();

  if (textFragment.string.empty()) {
    return;
  }

  fragments_.insert(fragments_.begin(), Fragment{textFragment});
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

template <typename T>
static auto getFragmentImpl(
    T& instance,
    AttributedString::FragmentHandle handle) -> decltype(auto) {
  auto fragmentPath = handle.fragmentPath;

  react_native_assert(fragmentPath.size() >= 1);

  auto& fragments = instance.getFragments();
  auto fragmentIndex = fragmentPath.front();
  auto& indexedFragment = fragments.at(fragmentIndex);

  if (fragmentPath.size() == 1) {
    return indexedFragment;
  } else {
    fragmentPath.pop_back();

    auto& substring = indexedFragment.asSpan().attributedSubstring;
    return substring.getFragment(
        AttributedString::FragmentHandle{fragmentPath});
  }
}

Fragment& AttributedString::getFragment(
    AttributedString::FragmentHandle handle) {
  return getFragmentImpl(*this, handle);
}

const Fragment& AttributedString::getFragment(
    AttributedString::FragmentHandle handle) const {
  return getFragmentImpl(*this, handle);
}

std::string AttributedString::getString() const {
  auto string = std::string{};
  for (const auto& fragment : fragments_) {
    string += fragment.getString();
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
    if (!fragments_.at(i).isContentEqual(rhs.fragments_.at(i))) {
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
        "TextFragment",
        fragment.string,
        SharedDebugStringConvertibleList(),
        propsList));
  }

  return list;
}
#endif

size_t attributedStringHash(const AttributedString& attributedString) {
  auto seed = size_t{0};

  for (const auto& fragment : attributedString.getFragments()) {
    facebook::react::hash_combine(seed, fragment);
  }

  return seed;
}

} // namespace facebook::react
