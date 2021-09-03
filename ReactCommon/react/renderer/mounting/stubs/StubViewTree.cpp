/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StubViewTree.h"

namespace facebook {
namespace react {

StubViewTree::StubViewTree(ShadowView const &shadowView) {
  auto view = std::make_shared<StubView>();
  view->update(shadowView);
  rootTag = shadowView.tag;
  registry[shadowView.tag] = view;
}

StubView const &StubViewTree::getRootStubView() const {
  return *registry.at(rootTag);
}

void StubViewTree::mutate(ShadowViewMutationList const &mutations) {
  for (auto const &mutation : mutations) {
    switch (mutation.type) {
      case ShadowViewMutation::Create: {
        assert(mutation.parentShadowView == ShadowView{});
        assert(mutation.oldChildShadowView == ShadowView{});
        auto stubView = std::make_shared<StubView>();
        auto tag = mutation.newChildShadowView.tag;
        assert(registry.find(tag) == registry.end());
        registry[tag] = stubView;
        break;
      }

      case ShadowViewMutation::Delete: {
        assert(mutation.parentShadowView == ShadowView{});
        assert(mutation.newChildShadowView == ShadowView{});
        auto tag = mutation.oldChildShadowView.tag;
        assert(registry.find(tag) != registry.end());
        registry.erase(tag);
        break;
      }

      case ShadowViewMutation::Insert: {
        assert(mutation.oldChildShadowView == ShadowView{});
        auto parentTag = mutation.parentShadowView.tag;
        assert(registry.find(parentTag) != registry.end());
        auto parentStubView = registry[parentTag];
        auto childTag = mutation.newChildShadowView.tag;
        assert(registry.find(childTag) != registry.end());
        auto childStubView = registry[childTag];
        childStubView->update(mutation.newChildShadowView);
        parentStubView->children.insert(
            parentStubView->children.begin() + mutation.index, childStubView);
        break;
      }

      case ShadowViewMutation::Remove: {
        assert(mutation.newChildShadowView == ShadowView{});
        auto parentTag = mutation.parentShadowView.tag;
        assert(registry.find(parentTag) != registry.end());
        auto parentStubView = registry[parentTag];
        auto childTag = mutation.oldChildShadowView.tag;
        assert(registry.find(childTag) != registry.end());
        auto childStubView = registry[childTag];
        assert(
            parentStubView->children[mutation.index]->tag ==
            childStubView->tag);
        parentStubView->children.erase(
            parentStubView->children.begin() + mutation.index);
        break;
      }

      case ShadowViewMutation::Update: {
        assert(
            mutation.newChildShadowView.tag == mutation.oldChildShadowView.tag);
        assert(
            registry.find(mutation.newChildShadowView.tag) != registry.end());
        auto stubView = registry[mutation.newChildShadowView.tag];
        stubView->update(mutation.newChildShadowView);
        break;
      }
    }
  }
}

bool operator==(StubViewTree const &lhs, StubViewTree const &rhs) {
  if (lhs.registry.size() != rhs.registry.size()) {
    return false;
  }

  for (auto const &pair : lhs.registry) {
    auto &lhsStubView = *lhs.registry.at(pair.first);
    auto &rhsStubView = *rhs.registry.at(pair.first);

    if (lhsStubView != rhsStubView) {
      return false;
    }
  }

  return true;
}

bool operator!=(StubViewTree const &lhs, StubViewTree const &rhs) {
  return !(lhs == rhs);
}

} // namespace react
} // namespace facebook
