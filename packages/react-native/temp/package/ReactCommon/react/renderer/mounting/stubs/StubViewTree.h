/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <unordered_map>

#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/mounting/stubs/StubView.h>

namespace facebook::react {

class StubViewTree {
 public:
  StubViewTree() = default;
  StubViewTree(const ShadowView& shadowView);

  void mutate(const ShadowViewMutationList& mutations);

  const StubView& getRootStubView() const;

  /*
   * Returns a view with given tag.
   */
  const StubView& getStubView(Tag tag) const;

  /*
   * Returns the total amount of views in the tree.
   */
  size_t size() const;

 private:
  Tag rootTag_{};
  std::unordered_map<Tag, StubView::Shared> registry_{};

  friend bool operator==(const StubViewTree& lhs, const StubViewTree& rhs);
  friend bool operator!=(const StubViewTree& lhs, const StubViewTree& rhs);

  std::ostream& dumpTags(std::ostream& stream);

  bool hasTag(Tag tag) const {
    return registry_.find(tag) != registry_.end();
  }
};

bool operator==(const StubViewTree& lhs, const StubViewTree& rhs);
bool operator!=(const StubViewTree& lhs, const StubViewTree& rhs);

} // namespace facebook::react
