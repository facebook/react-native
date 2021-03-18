/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StubViewTree.h"

#include <glog/logging.h>
#include <react/debug/react_native_assert.h>

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

StubView const &StubViewTree::getStubView(Tag tag) const {
  return *registry.at(tag);
}

size_t StubViewTree::size() const {
  return registry.size();
}

void StubViewTree::mutate(ShadowViewMutationList const &mutations) {
  STUB_VIEW_LOG({ LOG(ERROR) << "StubView: Mutating Begin"; });
  for (auto const &mutation : mutations) {
    switch (mutation.type) {
      case ShadowViewMutation::Create: {
        react_native_assert(mutation.parentShadowView == ShadowView{});
        react_native_assert(mutation.oldChildShadowView == ShadowView{});
        react_native_assert(mutation.newChildShadowView.props);
        auto stubView = std::make_shared<StubView>();
        stubView->update(mutation.newChildShadowView);
        auto tag = mutation.newChildShadowView.tag;
        STUB_VIEW_LOG({ LOG(ERROR) << "StubView: Create [" << tag << "]"; });
        react_native_assert(registry.find(tag) == registry.end());
        registry[tag] = stubView;
        break;
      }

      case ShadowViewMutation::Delete: {
        STUB_VIEW_LOG({
          LOG(ERROR) << "Delete [" << mutation.oldChildShadowView.tag << "]";
        });
        react_native_assert(mutation.parentShadowView == ShadowView{});
        react_native_assert(mutation.newChildShadowView == ShadowView{});
        auto tag = mutation.oldChildShadowView.tag;
        /* Disable this assert until T76057501 is resolved.
        react_native_assert(registry.find(tag) != registry.end());
        auto stubView = registry[tag];
        react_native_assert(
            (ShadowView)(*stubView) == mutation.oldChildShadowView);
        */
        registry.erase(tag);
        break;
      }

      case ShadowViewMutation::Insert: {
        if (!mutation.mutatedViewIsVirtual()) {
          react_native_assert(mutation.oldChildShadowView == ShadowView{});
          auto parentTag = mutation.parentShadowView.tag;
          react_native_assert(registry.find(parentTag) != registry.end());
          auto parentStubView = registry[parentTag];
          auto childTag = mutation.newChildShadowView.tag;
          react_native_assert(registry.find(childTag) != registry.end());
          auto childStubView = registry[childTag];
          react_native_assert(childStubView->parentTag == NO_VIEW_TAG);
          childStubView->update(mutation.newChildShadowView);
          STUB_VIEW_LOG({
            LOG(ERROR) << "StubView: Insert [" << childTag << "] into ["
                       << parentTag << "] @" << mutation.index << "("
                       << parentStubView->children.size() << " children)";
          });
          react_native_assert(
              parentStubView->children.size() >= mutation.index);
          childStubView->parentTag = parentTag;
          parentStubView->children.insert(
              parentStubView->children.begin() + mutation.index, childStubView);
        }
        break;
      }

      case ShadowViewMutation::Remove: {
        if (!mutation.mutatedViewIsVirtual()) {
          react_native_assert(mutation.newChildShadowView == ShadowView{});
          auto parentTag = mutation.parentShadowView.tag;
          react_native_assert(registry.find(parentTag) != registry.end());
          auto parentStubView = registry[parentTag];
          auto childTag = mutation.oldChildShadowView.tag;
          STUB_VIEW_LOG({
            LOG(ERROR) << "StubView: Remove [" << childTag << "] from ["
                       << parentTag << "] @" << mutation.index << " with "
                       << parentStubView->children.size() << " children";
          });
          react_native_assert(parentStubView->children.size() > mutation.index);
          react_native_assert(registry.find(childTag) != registry.end());
          auto childStubView = registry[childTag];
          react_native_assert(childStubView->parentTag == parentTag);
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
          react_native_assert(
              parentStubView->children.size() > mutation.index &&
              parentStubView->children[mutation.index]->tag ==
                  childStubView->tag);
          childStubView->parentTag = NO_VIEW_TAG;
          parentStubView->children.erase(
              parentStubView->children.begin() + mutation.index);
        }
        break;
      }

      case ShadowViewMutation::Update: {
        STUB_VIEW_LOG({
          LOG(ERROR) << "StubView: Update [" << mutation.newChildShadowView.tag
                     << "]";
        });
        react_native_assert(mutation.oldChildShadowView.tag != 0);
        react_native_assert(mutation.newChildShadowView.tag != 0);
        react_native_assert(mutation.newChildShadowView.props);
        react_native_assert(
            mutation.newChildShadowView.tag == mutation.oldChildShadowView.tag);
        react_native_assert(
            registry.find(mutation.newChildShadowView.tag) != registry.end());
        auto oldStubView = registry[mutation.newChildShadowView.tag];
        react_native_assert(oldStubView->tag != 0);
        react_native_assert(
            (ShadowView)(*oldStubView) == mutation.oldChildShadowView);
        oldStubView->update(mutation.newChildShadowView);
        break;
      }
    }
  }
  STUB_VIEW_LOG({ LOG(ERROR) << "StubView: Mutating End"; });

  // For iOS especially: flush logs because some might be lost on iOS if an
  // assert is hit right after this.
  google::FlushLogFiles(google::INFO);
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
