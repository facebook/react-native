/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <variant>

#include <folly/small_vector.h>

#include <react/renderer/attributedstring/SpanAttributes.h>
#include <react/renderer/attributedstring/TextAttributes.h>
#include <react/renderer/core/Sealable.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/mounting/ShadowView.h>
#include <react/utils/hash_combine.h>

namespace facebook::react {

class AttributedString;

using SharedAttributedString = std::shared_ptr<const AttributedString>;

/*
 * Simple, cross-platform, React-specific implementation of attributed string
 * (aka spanned string).
 * `AttributedString` is basically a list of `Fragments` which have `string` and
 * `textAttributes` + `shadowNode` associated with the `string`.
 */
class AttributedString : public Sealable, public DebugStringConvertible {
 public:
  /*
   * A TextFragment represents a part of the AttributedString with its own set
   * of attributes.
   */
  class TextFragment {
   public:
    static std::string AttachmentCharacter();

    std::string string;
    TextAttributes textAttributes;
    ShadowView parentShadowView;

    /*
     * Returns true is the TextFragment represents an attachment.
     * Equivalent to `string == AttachmentCharacter()`.
     */
    bool isAttachment() const;

    inline std::string getString() const {
      return string;
    }

    /*
     * Returns whether the underlying text and attributes are equal,
     * disregarding layout or other information.
     */
    bool isContentEqual(const TextFragment& rhs) const;

    bool operator==(const TextFragment& rhs) const;
    bool operator!=(const TextFragment& rhs) const;
  };

  class FragmentHandle {
    friend class AttributedString;

   public:
    static FragmentHandle nil;

    inline FragmentHandle(folly::small_vector<size_t, 2> fragmentPath)
        : fragmentPath(fragmentPath) {}

    inline FragmentHandle concat(const FragmentHandle& outerHandle) const {
      auto fullFragmentPath = fragmentPath;
      fullFragmentPath.insert(
          fullFragmentPath.end(),
          outerHandle.fragmentPath.begin(),
          outerHandle.fragmentPath.end());
      return FragmentHandle{fullFragmentPath};
    }

    /**
     * A path to the fragment in the AttributedString. `fragmentPath[0]` is the
     * index of the fragment within its parent, `fragmentPath[1]` is the index
     * of the fragment's parent within its own parent, etc. `fragmentPath[n -
     * 1]` is the index of the top-most fragment ancestor within the root
     * attributed string.
     */
    const folly::small_vector<size_t, 2> fragmentPath;
  };

  class SpanFragment;

  class Fragment;

  class Range {
   public:
    int location{0};
    int length{0};
  };

  using Fragments = std::vector<Fragment>;

  /*
   * Appends a `fragment` to the string. Returns a handle to the added fragment.
   */
  AttributedString::FragmentHandle appendFragment(const Fragment& fragment);
  AttributedString::FragmentHandle appendSpanFragment(
      const SpanFragment& spanFragment);
  AttributedString::FragmentHandle appendTextFragment(
      const TextFragment& fragment);

  /*
   * Prepends a `fragment` to the string (if that fragment is not empty).
   */
  void prependTextFragment(const TextFragment& fragment);

  /*
   * Appends and prepends an `attributedString` (all its fragments) to
   * the string.
   */
  void appendAttributedString(const AttributedString& attributedString);
  void prependAttributedString(const AttributedString& attributedString);

  /*
   * Returns a read-only reference to a list of fragments.
   */
  const Fragments& getFragments() const;

  /*
   * Returns a reference to a list of fragments.
   */
  Fragments& getFragments();

  Fragment& getFragment(FragmentHandle handle);
  const Fragment& getFragment(FragmentHandle handle) const;

  /*
   * Returns a string constructed from all strings in all fragments.
   */
  std::string getString() const;

  /*
   * Returns `true` if the string is empty (has no any fragments).
   */
  bool isEmpty() const;

  bool isContentEqual(const AttributedString& rhs) const;

  bool operator==(const AttributedString& rhs) const;
  bool operator!=(const AttributedString& rhs) const;

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugChildren() const override;
#endif

 private:
  Fragments fragments_;
};

class AttributedString::SpanFragment {
 public:
  inline std::string getString() const {
    return attributedSubstring.getString();
  }

  bool isContentEqual(const SpanFragment& rhs) const;

  bool operator==(const SpanFragment& rhs) const;
  bool operator!=(const SpanFragment& rhs) const;

  SpanAttributes spanAttributes;
  AttributedString attributedSubstring;
};

class AttributedString::Fragment {
 public:
  enum Kind {
    Text,
    Span,
  };

  inline explicit Fragment(TextFragment textFragment)
      : variant_(std::move(textFragment)) {}

  inline explicit Fragment(SpanFragment spanFragment)
      : variant_(std::move(spanFragment)) {}

  Kind getKind() const;

  TextFragment& asText();
  const TextFragment& asText() const;

  SpanFragment& asSpan();
  const SpanFragment& asSpan() const;

  inline std::string getString() const {
    return std::visit([](auto&& arg) { return arg.getString(); }, variant_);
  }

  bool isContentEqual(const Fragment& rhs) const;

  bool operator==(const Fragment& rhs) const;
  bool operator!=(const Fragment& rhs) const;

 private:
  // Generic parameters must be in the same order as the kind enum
  std::variant<TextFragment, SpanFragment> variant_;
};

size_t attributedStringHash(
    const facebook::react::AttributedString& attributedString);

} // namespace facebook::react

namespace std {
template <>
struct hash<facebook::react::AttributedString::TextFragment> {
  size_t operator()(
      const facebook::react::AttributedString::TextFragment& fragment) const {
    return facebook::react::hash_combine(
        fragment.string,
        fragment.textAttributes,
        fragment.parentShadowView,
        fragment.parentShadowView.layoutMetrics);
  }
};

template <>
struct hash<facebook::react::AttributedString::SpanFragment> {
  size_t operator()(
      const facebook::react::AttributedString::SpanFragment& fragment) const {
    return facebook::react::hash_combine(
        fragment.spanAttributes,
        facebook::react::attributedStringHash(fragment.attributedSubstring));
  }
};

template <>
struct hash<facebook::react::AttributedString::Fragment> {
  size_t operator()(
      const facebook::react::AttributedString::Fragment& fragment) const {
    switch (fragment.getKind()) {
      case facebook::react::AttributedString::Fragment::Text:
        return std::hash<facebook::react::AttributedString::TextFragment>{}(
            fragment.asText());
      case facebook::react::AttributedString::Fragment::Span:
        return std::hash<facebook::react::AttributedString::SpanFragment>{}(
            fragment.asSpan());
    }
  }
};

template <>
struct hash<facebook::react::AttributedString> {
  size_t operator()(
      const facebook::react::AttributedString& attributedString) const {
    return attributedStringHash(attributedString);
  }
};
} // namespace std
