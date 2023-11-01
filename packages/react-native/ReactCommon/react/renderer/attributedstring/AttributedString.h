/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/renderer/attributedstring/TextAttributes.h>
#include <react/renderer/attributedstring/SpanAttributes.h>
#include <react/renderer/core/Sealable.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/mounting/ShadowView.h>
#include <react/utils/hash_combine.h>

namespace facebook::react {

class AttributedString;

using SharedAttributedString = std::shared_ptr<const AttributedString>;

/*
 * A simple, cross-platform, React-specific implementation of an attributed
 * string (also known as spanned string).
 */
class AttributedString : public Sealable, public DebugStringConvertible {
 public:
  /*
   * A Fragment represents a part of the AttributedString with its own set of
   * attributes.
   */
  class Fragment {
   public:
    static std::string AttachmentCharacter();

    /*
     * The encapsulated text fragment content.
     */
    std::string string;

    /*
     * Defines the attributes (like font, color, size etc.) of the text
     * fragment.
     */
    TextAttributes textAttributes;

    /*
     * The `ShadowView` that is associated with the encapsulated text fragment.
     */
    ShadowView parentShadowView;

    /*
     * Returns true is the Fragment represents an attachment.
     * Equivalent to `string == AttachmentCharacter()`.
     */
    bool isAttachment() const;

    /*
     * Returns whether the underlying text and attributes are equal,
     * disregarding layout or other information.
     */
    bool isContentEqual(const Fragment& rhs) const;

    bool operator==(const Fragment& rhs) const;
    bool operator!=(const Fragment& rhs) const;
  };

  /*
   * A Span represents a sequence of Fragments in the AttributedString.
   * It is responsible for carrying styles that apply to multiple fragments
   * (e.g. borders).
   */
  class Span : public Sealable, public DebugStringConvertible {
   public:
    using Fragments = std::vector<Fragment>;

    /*
     * Defines the attributes (like fill-line-gap, border, etc.) of the span.
     */
    SpanAttributes spanAttributes;

    /*
     * Returns a read-only reference to a list of fragments.
     */
    const Fragments& getFragments() const;

    /*
     * Returns a reference to a list of fragments.
     */
    Fragments& getFragments();

    /*
     * Returns a string constructed from all strings in all fragments.
     */
    std::string getString() const;

    /*
     * Returns `true` if the span is empty (has no fragments).
     */
    bool isEmpty() const;

    /*
     * Compares equality of TextAttributes of all Fragments on both sides.
     */
    bool compareTextAttributesWithoutFrame(const Span& rhs) const;

    bool isContentEqual(const Span& rhs) const;

    /*
     * Returns the number of attachments in the span.
     */
    int countAttachments() const;

    /*
     * Appends and prepends a `fragment` to the string.
     */
    void appendFragment(const Fragment& fragment);
    void prependFragment(const Fragment& fragment);

    bool operator==(const Span& rhs) const;
    bool operator!=(const Span& rhs) const;

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
    SharedDebugStringConvertibleList getDebugChildren() const override;
#endif

    virtual ~Span() = default;

   private:
    Fragments fragments_;
  };

  /*
   * A helper class that holds indices to locate a specific fragment within an
   * attributed string.
   */
  class FragmentHandle final {
   public:
    const size_t spanIndex;
    const size_t fragmentIndex;

    FragmentHandle(size_t spanIndex, size_t fragmentIndex)
        : spanIndex{spanIndex}, fragmentIndex{fragmentIndex} {}
  };

  class Range {
   public:
    int location{0};
    int length{0};
  };

  using Fragments = std::vector<Fragment>;
  using Spans = std::vector<Span>;

  /*
   * Appends and prepends a span to the string.
   */
  void appendSpan(const Span& span);
  void prependSpan(const Span& span);

  /*
   * Returns the number of attachments in the attributed string.
   */
  int countAttachments() const;

  /*
   * Appends and prepends an `attributedString` (all its spans) to
   * the string.
   */
  void appendAttributedString(const AttributedString& attributedString);
  void prependAttributedString(const AttributedString& attributedString);

  /*
   * Returns a read-only reference to a list of spans.
   */
  const Spans& getSpans() const;

  /*
   * Returns a reference to a list of spans.
   */
  Spans& getSpans();

  /*
   * Returns a list of all fragments in the attributed string.
   */
  const Fragments getAllFragments() const;

  Fragment& getFragment(FragmentHandle handle);

  const Fragment& getFragment(FragmentHandle handle) const;

  /*
   * Returns a string constructed from all strings in all fragments.
   */
  std::string getString() const;

  /*
   * Returns `true` if the attributed string is empty (has no fragments).
   */
  bool isEmpty() const;

  /*
   * Compares equality of TextAttributes of all Fragments on both sides.
   */
  bool compareTextAttributesWithoutFrame(const AttributedString& rhs) const;

  bool isContentEqual(const AttributedString& rhs) const;

 protected:
  virtual void sealChildren() const override;

 public:
  bool operator==(const AttributedString& rhs) const;
  bool operator!=(const AttributedString& rhs) const;

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugChildren() const override;
#endif

 private:
  Spans spans_;
};

} // namespace facebook::react

namespace std {
template <>
struct hash<facebook::react::AttributedString::Fragment> {
  size_t operator()(
      const facebook::react::AttributedString::Fragment& fragment) const {
    return facebook::react::hash_combine(
        fragment.string,
        fragment.textAttributes,
        fragment.parentShadowView,
        fragment.parentShadowView.layoutMetrics);
  }
};

template <>
struct hash<facebook::react::AttributedString::Span> {
  size_t operator()(const facebook::react::AttributedString::Span& span) const {
    auto seed = size_t{0};

    for (const auto& fragment : span.getFragments()) {
      facebook::react::hash_combine(seed, fragment);
    }

    return seed;
  }
};

template <>
struct hash<facebook::react::AttributedString> {
  size_t operator()(
      const facebook::react::AttributedString& attributedString) const {
    auto seed = size_t{0};

    for (const auto& span : attributedString.getSpans()) {
      facebook::react::hash_combine(seed, span);
    }

    return seed;
  }
};
} // namespace std
