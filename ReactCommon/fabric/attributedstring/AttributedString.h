/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fabric/attributedstring/TextAttributes.h>
#include <fabric/core/Sealable.h>
#include <fabric/core/ShadowNode.h>
#include <fabric/debug/DebugStringConvertible.h>
#include <folly/Optional.h>

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
class AttributedString:
  public Sealable,
  public DebugStringConvertible {

public:

  class Fragment {
  public:
    std::string string;
    TextAttributes textAttributes;
    SharedShadowNode shadowNode;
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

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugChildren() const override;

private:

  Fragments fragments_;
};

} // namespace react
} // namespace facebook
