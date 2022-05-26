/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
        STUB_VIEW_LOG({
          LOG(ERROR) << "StubView: Create [" << tag << "] ##"
                     << std::hash<ShadowView>{}((ShadowView)*stubView);
        });
        react_native_assert(registry.find(tag) == registry.end());
        registry[tag] = stubView;
        break;
      }

      case ShadowViewMutation::Delete: {
        STUB_VIEW_LOG({
          LOG(ERROR) << "StubView: Delete [" << mutation.oldChildShadowView.tag
                     << "] ##"
                     << std::hash<ShadowView>{}(mutation.oldChildShadowView);
        });
        react_native_assert(mutation.parentShadowView == ShadowView{});
        react_native_assert(mutation.newChildShadowView == ShadowView{});
        auto tag = mutation.oldChildShadowView.tag;
        react_native_assert(registry.find(tag) != registry.end());
        auto stubView = registry[tag];
        if ((ShadowView)(*stubView) != mutation.oldChildShadowView) {
          LOG(ERROR)
              << "StubView: ASSERT FAILURE: DELETE mutation assertion failure: oldChildShadowView does not match stubView: ["
              << mutation.oldChildShadowView.tag << "] stub hash: ##"
              << std::hash<ShadowView>{}((ShadowView)*stubView)
              << " old mutation hash: ##"
              << std::hash<ShadowView>{}(mutation.oldChildShadowView);
#ifdef RN_DEBUG_STRING_CONVERTIBLE
          LOG(ERROR) << "StubView: "
                     << getDebugPropsDescription((ShadowView)*stubView, {});
          LOG(ERROR) << "OldChildShadowView: "
                     << getDebugPropsDescription(
                            mutation.oldChildShadowView, {});
#endif
        }
        react_native_assert(
            (ShadowView)(*stubView) == mutation.oldChildShadowView);
        registry.erase(tag);
        break;
      }

      case ShadowViewMutation::Insert: {
        if (!mutation.mutatedViewIsVirtual()) {
          react_native_assert(mutation.oldChildShadowView == ShadowView{});
          auto parentTag = mutation.parentShadowView.tag;
          auto childTag = mutation.newChildShadowView.tag;
          if (registry.find(parentTag) == registry.end()) {
            LOG(ERROR)
                << "StubView: ASSERT FAILURE: INSERT mutation assertion failure: parentTag not found: ["
                << parentTag << "] inserting child: [" << childTag << "]";
          }
          if (registry.find(childTag) == registry.end()) {
            LOG(ERROR)
                << "StubView: ASSERT FAILURE: INSERT mutation assertion failure: childTag not found: ["
                << parentTag << "] inserting child: [" << childTag << "]";
          }
          react_native_assert(registry.find(parentTag) != registry.end());
          auto parentStubView = registry[parentTag];
          react_native_assert(registry.find(childTag) != registry.end());
          auto childStubView = registry[childTag];
          childStubView->update(mutation.newChildShadowView);
          STUB_VIEW_LOG({
            LOG(ERROR) << "StubView: Insert [" << childTag << "] into ["
                       << parentTag << "] @" << mutation.index << "("
                       << parentStubView->children.size() << " children)";
          });
          react_native_assert(childStubView->parentTag == NO_VIEW_TAG);
          react_native_assert(
              mutation.index >= 0 &&
              parentStubView->children.size() >=
                  static_cast<size_t>(mutation.index));
          childStubView->parentTag = parentTag;
          parentStubView->children.insert(
              parentStubView->children.begin() + mutation.index, childStubView);
        } else {
          auto childTag = mutation.newChildShadowView.tag;
          react_native_assert(registry.find(childTag) != registry.end());
          auto childStubView = registry[childTag];
          childStubView->update(mutation.newChildShadowView);
        }
        break;
      }

      case ShadowViewMutation::Remove: {
        if (!mutation.mutatedViewIsVirtual()) {
          react_native_assert(mutation.newChildShadowView == ShadowView{});
          auto parentTag = mutation.parentShadowView.tag;
          auto childTag = mutation.oldChildShadowView.tag;
          if (registry.find(parentTag) == registry.end()) {
            LOG(ERROR)
                << "StubView: ASSERT FAILURE: REMOVE mutation assertion failure: parentTag not found: ["
                << parentTag << "] removing child: [" << childTag << "]";
          }
          react_native_assert(registry.find(parentTag) != registry.end());
          auto parentStubView = registry[parentTag];
          STUB_VIEW_LOG({
            LOG(ERROR) << "StubView: Remove [" << childTag << "] from ["
                       << parentTag << "] @" << mutation.index << " with "
                       << parentStubView->children.size() << " children";
          });
          react_native_assert(
              mutation.index >= 0 &&
              parentStubView->children.size() >
                  static_cast<size_t>(mutation.index));
          react_native_assert(registry.find(childTag) != registry.end());
          auto childStubView = registry[childTag];
          if ((ShadowView)(*childStubView) != mutation.oldChildShadowView) {
            LOG(ERROR)
                << "StubView: ASSERT FAILURE: REMOVE mutation assertion failure: oldChildShadowView does not match oldStubView: ["
                << mutation.oldChildShadowView.tag << "] stub hash: ##"
                << std::hash<ShadowView>{}((ShadowView)*childStubView)
                << " old mutation hash: ##"
                << std::hash<ShadowView>{}(mutation.oldChildShadowView);
#ifdef RN_DEBUG_STRING_CONVERTIBLE
            LOG(ERROR) << "ChildStubView: "
                       << getDebugPropsDescription(
                              (ShadowView)*childStubView, {});
            LOG(ERROR) << "OldChildShadowView: "
                       << getDebugPropsDescription(
                              mutation.oldChildShadowView, {});
#endif
          }
          react_native_assert(
              (ShadowView)(*childStubView) == mutation.oldChildShadowView);
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
              mutation.index >= 0 &&
              parentStubView->children.size() >
                  static_cast<size_t>(mutation.index) &&
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
                     << "] old hash: ##"
                     << std::hash<ShadowView>{}(mutation.oldChildShadowView)
                     << " new hash: ##"
                     << std::hash<ShadowView>{}(mutation.newChildShadowView);
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
        if ((ShadowView)(*oldStubView) != mutation.oldChildShadowView) {
          LOG(ERROR)
              << "StubView: ASSERT FAILURE: UPDATE mutation assertion failure: oldChildShadowView does not match oldStubView: ["
              << mutation.oldChildShadowView.tag << "] old stub hash: ##"
              << std::hash<ShadowView>{}((ShadowView)*oldStubView)
              << " old mutation hash: ##"
              << std::hash<ShadowView>{}(mutation.oldChildShadowView);
#ifdef RN_DEBUG_STRING_CONVERTIBLE
          LOG(ERROR) << "OldStubView: "
                     << getDebugPropsDescription((ShadowView)*oldStubView, {});
          LOG(ERROR) << "OldChildShadowView: "
                     << getDebugPropsDescription(
                            mutation.oldChildShadowView, {});
#endif
        }
        react_native_assert(
            (ShadowView)(*oldStubView) == mutation.oldChildShadowView);
        oldStubView->update(mutation.newChildShadowView);

        // Hash for stub view and the ShadowView should be identical - this
        // tests that StubView and ShadowView hash are equivalent.
        react_native_assert(
            std::hash<ShadowView>{}((ShadowView)*oldStubView) ==
            std::hash<ShadowView>{}(mutation.newChildShadowView));

        break;
      }
    }
  }
  STUB_VIEW_LOG({ LOG(ERROR) << "StubView: Mutating End"; });

  // For iOS especially: flush logs because some might be lost on iOS if an
  // assert is hit right after this.
  google::FlushLogFiles(google::GLOG_INFO);
}

bool operator==(StubViewTree const &lhs, StubViewTree const &rhs) {
  if (lhs.registry.size() != rhs.registry.size()) {
    STUB_VIEW_LOG({
      LOG(ERROR) << "Registry sizes are different. Sizes: LHS: "
                 << lhs.registry.size() << " RHS: " << rhs.registry.size();

      [&](std::ostream &stream) -> std::ostream & {
        stream << "Tags in LHS: ";
        for (auto const &pair : lhs.registry) {
          auto &lhsStubView = *lhs.registry.at(pair.first);
          stream << "[" << lhsStubView.tag << "]##"
                 << std::hash<ShadowView>{}((ShadowView)lhsStubView) << " ";
        }
        return stream;
      }(LOG(ERROR));

      [&](std::ostream &stream) -> std::ostream & {
        stream << "Tags in RHS: ";
        for (auto const &pair : rhs.registry) {
          auto &rhsStubView = *rhs.registry.at(pair.first);
          stream << "[" << rhsStubView.tag << "]##"
                 << std::hash<ShadowView>{}((ShadowView)rhsStubView) << " ";
        }
        return stream;
      }(LOG(ERROR));
    });

    return false;
  }

  for (auto const &pair : lhs.registry) {
    auto &lhsStubView = *lhs.registry.at(pair.first);
    auto &rhsStubView = *rhs.registry.at(pair.first);

    if (lhsStubView != rhsStubView) {
      STUB_VIEW_LOG({
        LOG(ERROR) << "Registry entries are different. LHS: ["
                   << lhsStubView.tag << "] ##"
                   << std::hash<ShadowView>{}((ShadowView)lhsStubView)
                   << " RHS: [" << rhsStubView.tag << "] ##"
                   << std::hash<ShadowView>{}((ShadowView)rhsStubView);
      });
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
