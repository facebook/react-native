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
using FragmentHandle = AttributedString::FragmentHandle;

using Span = AttributedString::Span;
using Spans = AttributedString::Spans;

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

#pragma mark - Span

const Fragments& Span::getFragments() const {
  return fragments_;
}

Fragments& Span::getFragments() {
  return fragments_;
}

std::string Span::getString() const {
  auto string = std::string{};
  for (const auto& fragment : fragments_) {
    string += fragment.string;
  }
  return string;
}

void Span::appendFragment(const Fragment& fragment) {
  ensureUnsealed();

  if (fragment.string.empty()) {
    return;
  }

  fragments_.push_back(fragment);
}

void Span::prependFragment(const Fragment& fragment) {
  ensureUnsealed();

  if (fragment.string.empty()) {
    return;
  }

  fragments_.insert(fragments_.begin(), fragment);
}

bool Span::isEmpty() const {
  return fragments_.empty();
}

bool Span::compareTextAttributesWithoutFrame(const Span& rhs) const {
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

bool Span::isContentEqual(const Span& rhs) const {
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

int Span::countAttachments() const {
  int count = 0;

  for (const auto& fragment : fragments_) {
    if (fragment.isAttachment()) {
      count++;
    }
  }

  return count;
}

bool Span::operator==(const Span& rhs) const {
  return fragments_ == rhs.fragments_;
}

bool Span::operator!=(const Span& rhs) const {
  return !(*this == rhs);
}

#pragma mark - AttributedString

void AttributedString::appendSpan(const Span& span) {
  ensureUnsealed();

  if (span.isEmpty()) {
    return;
  }

  spans_.push_back(span);
}

void AttributedString::prependSpan(const Span& span) {
  ensureUnsealed();

  if (span.isEmpty()) {
    return;
  }

  spans_.insert(spans_.begin(), span);
}

void AttributedString::appendAttributedString(
    const AttributedString& attributedString) {
  ensureUnsealed();
  spans_.insert(
      spans_.end(),
      attributedString.spans_.begin(),
      attributedString.spans_.end());
}

void AttributedString::prependAttributedString(
    const AttributedString& attributedString) {
  ensureUnsealed();
  spans_.insert(
      spans_.begin(),
      attributedString.spans_.begin(),
      attributedString.spans_.end());
}

const Spans& AttributedString::getSpans() const {
  return spans_;
}

Spans& AttributedString::getSpans() {
  return spans_;
}

const Fragments AttributedString::getAllFragments() const {
  auto fragments = Fragments{};

  for (const auto& span : spans_) {
    for (const auto& fragment : span.getFragments()) {
      fragments.push_back(fragment);
    }
  }

  return fragments;
}

Fragment& AttributedString::getFragment(FragmentHandle handle) {
  return getSpans()[handle.spanIndex].getFragments()[handle.fragmentIndex];
}

const Fragment& AttributedString::getFragment(FragmentHandle handle) const {
  return getSpans()[handle.spanIndex].getFragments()[handle.fragmentIndex];
}

std::string AttributedString::getString() const {
  auto string = std::string{};
  for (const auto& span : spans_) {
    string += span.getString();
  }
  return string;
}

bool AttributedString::isEmpty() const {
  return spans_.empty();
}

bool AttributedString::compareTextAttributesWithoutFrame(
    const AttributedString& rhs) const {
  if (spans_.size() != rhs.spans_.size()) {
    return false;
  }

  for (size_t i = 0; i < spans_.size(); i++) {
    if (!spans_[i].compareTextAttributesWithoutFrame(rhs.spans_[i])) {
      return false;
    }
  }

  return true;
}

bool AttributedString::isContentEqual(const AttributedString& rhs) const {
  if (spans_.size() != rhs.spans_.size()) {
    return false;
  }

  for (size_t i = 0; i < spans_.size(); i++) {
    if (!spans_[i].isContentEqual(rhs.spans_[i])) {
      return false;
    }
  }

  return true;
}

int AttributedString::countAttachments() const {
  int count = 0;

  for (const auto& span : spans_) {
    count += span.countAttachments();
  }

  return count;
}

void AttributedString::sealChildren() const {
  for (const Span& span : spans_) {
    span.seal();
  }
}

bool AttributedString::operator==(const AttributedString& rhs) const {
  return spans_ == rhs.spans_;
}

bool AttributedString::operator!=(const AttributedString& rhs) const {
  return !(*this == rhs);
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList Span::getDebugChildren() const {
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

SharedDebugStringConvertibleList AttributedString::getDebugChildren() const {
  auto list = SharedDebugStringConvertibleList{};

  for (auto&& span : spans_) {
    list.push_back(
        std::make_shared<DebugStringConvertibleItem>("Span", span.getString()));
  }

  return list;
}
#endif

} // namespace facebook::react
