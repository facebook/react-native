/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

#include <folly/Hash.h>
#include <folly/Optional.h>
#include <react/attributedstring/TextAttributes.h>
#include <react/core/Sealable.h>
#include <react/core/ShadowNode.h>
#include <react/debug/DebugStringConvertible.h>
#include <react/mounting/ShadowView.h>

namespace facebook {
namespace react {

class AttributedString;

using SharedAttributedString = std::shared_ptr<const AttributedString>;

/*
 * Simple, cross-platfrom, React-specific implementation of attributed string
 * (aka spanned string).
 * `AttributedString` is basically a list of `Fragments` which have `string` and
 * `textAttributes` + `shadowNode` associated with the `string`.
 */
class AttributedString : public Sealable, public DebugStringConvertible {
 public:
  class Fragment {
   public:
    std::string string;
    TextAttributes textAttributes;
    ShadowView shadowView;
    ShadowView parentShadowView;

    bool operator==(const Fragment &rhs) const;
    bool operator!=(const Fragment &rhs) const;
  };

  using Fragments = std::vector<Fragment>;

  /*
   * Appends and prepends a `fragment` to the string.
   */
  void appendFragment(const Fragment &fragment);
  void prependFragment(const Fragment &fragment);

  /*
   * Appends and prepends an `attributedString` (all its fragments) to
   * the string.
   */
  void appendAttributedString(const AttributedString &attributedString);
  void prependAttributedString(const AttributedString &attributedString);

  /*
   * Returns read-only reference to a list of fragments.
   */
  const Fragments &getFragments() const;

  /*
   * Returns a string constructed from all strings in all fragments.
   */
  std::string getString() const;

  bool operator==(const AttributedString &rhs) const;
  bool operator!=(const AttributedString &rhs) const;

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugChildren() const override;
#endif

 private:
  Fragments fragments_;
};

} // namespace react
} // namespace facebook

namespace std {
template <>
struct hash<facebook::react::AttributedString::Fragment> {
  size_t operator()(
      const facebook::react::AttributedString::Fragment &fragment) const {
    auto seed = size_t{0};
    folly::hash::hash_combine(
        seed,
        fragment.string,
        fragment.textAttributes,
        fragment.shadowView,
        fragment.parentShadowView);
    return seed;
  }
};

template <>
struct hash<facebook::react::AttributedString> {
  size_t operator()(
      const facebook::react::AttributedString &attributedString) const {
    auto seed = size_t{0};

    for (const auto &fragment : attributedString.getFragments()) {
      folly::hash::hash_combine(seed, fragment);
    }

    return seed;
  }
};
} // namespace std
