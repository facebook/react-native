/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StubViewTree.h"

#include <glog/logging.h>

// Uncomment to enable verbose StubViewTree debug logs
// #define STUB_VIEW_TREE_VERBOSE 1

#define STUB_VIEW_ASSERT(cond)                 \
  if (!(cond)) {                               \
    LOG(ERROR) << "ASSERT FAILURE: " << #cond; \
  }                                            \
  assert(cond);

#ifdef STUB_VIEW_TREE_VERBOSE
#define STUB_VIEW_LOG(code) code
#else
#define STUB_VIEW_LOG(code)
#endif

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

/**
 * ignoreDuplicateCreates: when stubs generates "fake" mutation instructions, in
 * some cases it can produce too many "create" instructions. We ignore
 * duplicates and treat them as noops. In the case of verifying actual diffing,
 * that assert is left on.
 *
 * @param mutations
 * @param ignoreDuplicateCreates
 */
void StubViewTree::mutate(
    ShadowViewMutationList const &mutations,
    bool ignoreDuplicateCreates) {
  STUB_VIEW_LOG({ LOG(ERROR) << "StubView: Mutating Begin"; });
  for (auto const &mutation : mutations) {
    switch (mutation.type) {
      case ShadowViewMutation::Create: {
        STUB_VIEW_ASSERT(mutation.parentShadowView == ShadowView{});
        STUB_VIEW_ASSERT(mutation.oldChildShadowView == ShadowView{});
        auto stubView = std::make_shared<StubView>();
        auto tag = mutation.newChildShadowView.tag;
        STUB_VIEW_LOG({ LOG(ERROR) << "StubView: Create: " << tag; });
        if (!ignoreDuplicateCreates) {
          STUB_VIEW_ASSERT(registry.find(tag) == registry.end());
        }
        registry[tag] = stubView;
        break;
      }

      case ShadowViewMutation::Delete: {
        STUB_VIEW_LOG(
            { LOG(ERROR) << "Delete " << mutation.oldChildShadowView.tag; });
        STUB_VIEW_ASSERT(mutation.parentShadowView == ShadowView{});
        STUB_VIEW_ASSERT(mutation.newChildShadowView == ShadowView{});
        auto tag = mutation.oldChildShadowView.tag;
        STUB_VIEW_ASSERT(registry.find(tag) != registry.end());
        registry.erase(tag);
        break;
      }

      case ShadowViewMutation::Insert: {
        STUB_VIEW_ASSERT(mutation.oldChildShadowView == ShadowView{});
        auto parentTag = mutation.parentShadowView.tag;
        STUB_VIEW_ASSERT(registry.find(parentTag) != registry.end());
        auto parentStubView = registry[parentTag];
        auto childTag = mutation.newChildShadowView.tag;
        STUB_VIEW_ASSERT(registry.find(childTag) != registry.end());
        auto childStubView = registry[childTag];
        childStubView->update(mutation.newChildShadowView);
        STUB_VIEW_LOG({
          LOG(ERROR) << "StubView: Insert: " << childTag << " into "
                     << parentTag << " at " << mutation.index << "("
                     << parentStubView->children.size() << " children)";
        });
        STUB_VIEW_ASSERT(parentStubView->children.size() >= mutation.index);
        parentStubView->children.insert(
            parentStubView->children.begin() + mutation.index, childStubView);
        break;
      }

      case ShadowViewMutation::Remove: {
        STUB_VIEW_ASSERT(mutation.newChildShadowView == ShadowView{});
        auto parentTag = mutation.parentShadowView.tag;
        STUB_VIEW_ASSERT(registry.find(parentTag) != registry.end());
        auto parentStubView = registry[parentTag];
        auto childTag = mutation.oldChildShadowView.tag;
        STUB_VIEW_LOG({
          LOG(ERROR) << "StubView: Remove: " << childTag << " from "
                     << parentTag << " at index " << mutation.index << " with "
                     << parentStubView->children.size() << " children";
        });
        STUB_VIEW_ASSERT(parentStubView->children.size() > mutation.index);
        STUB_VIEW_ASSERT(registry.find(childTag) != registry.end());
        auto childStubView = registry[childTag];
        bool childIsCorrect =
            parentStubView->children.size() > mutation.index &&
            parentStubView->children[mutation.index]->tag == childStubView->tag;
        STUB_VIEW_LOG({
          std::string strChildList = "";
          int i = 0;
          for (auto const &child : parentStubView->children) {
            strChildList.append(std::to_string(i));
            strChildList.append(":");
            strChildList.append(std::to_string(child->tag));
            strChildList.append(", ");
            i++;
          }
          LOG(ERROR) << "StubView: BEFORE REMOVE: Children of " << parentTag
                     << ": " << strChildList;
        });
        STUB_VIEW_ASSERT(childIsCorrect);
        parentStubView->children.erase(
            parentStubView->children.begin() + mutation.index);
        break;
      }

      case ShadowViewMutation::Update: {
        STUB_VIEW_LOG({
          LOG(ERROR) << "StubView: Update: " << mutation.newChildShadowView.tag;
        });

        // We don't have a strict requirement that oldChildShadowView has any
        // data. In particular, LayoutAnimations can produce UPDATEs with only a
        // new node.
        STUB_VIEW_ASSERT(
            mutation.newChildShadowView.tag ==
                mutation.oldChildShadowView.tag ||
            mutation.oldChildShadowView.tag == 0);

        STUB_VIEW_ASSERT(
            registry.find(mutation.newChildShadowView.tag) != registry.end());
        auto stubView = registry[mutation.newChildShadowView.tag];
        stubView->update(mutation.newChildShadowView);
        break;
      }
    }
  }
  STUB_VIEW_LOG({ LOG(ERROR) << "StubView: Mutating End"; });
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
