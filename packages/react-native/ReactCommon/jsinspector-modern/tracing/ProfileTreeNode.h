/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <utility>

#include <jsinspector-modern/tracing/RuntimeSamplingProfile.h>

namespace facebook::react::jsinspector_modern::tracing {

/*
 * Auxiliary data structure used for creating Profile tree and identifying
 * identical frames.
 */
class ProfileTreeNode {
 public:
  /*
   * For Chromium & V8 this could also be WASM, this is not the case for us.
   */
  enum class CodeType {
    JavaScript,
    Other,
  };

  ProfileTreeNode(
      uint32_t id,
      CodeType codeType,
      std::shared_ptr<ProfileTreeNode> parent,
      RuntimeSamplingProfile::SampleCallStackFrame callFrame)
      : id_(id),
        codeType_(codeType),
        parent_(parent),
        callFrame_(std::move(callFrame)) {}

  uint32_t getId() const {
    return id_;
  }

  CodeType getCodeType() const {
    return codeType_;
  }

  /**
   * \return pointer to the parent node, nullptr if this is the root node.
   */
  ProfileTreeNode* getParent() const {
    return parent_.get();
  }

  /**
   * \return call frame information that is represented by this node.
   */
  const RuntimeSamplingProfile::SampleCallStackFrame& getCallFrame() const {
    return callFrame_;
  }

  /**
   * Will only add unique child node.
   * \return shared pointer to the already existing child node, nullptr if the
   * added child node is unique.
   */
  std::shared_ptr<ProfileTreeNode> addChild(
      std::shared_ptr<ProfileTreeNode> child) {
    for (const auto& existingChild : children_) {
      if (*existingChild == child.get()) {
        return existingChild;
      }
    }

    children_.push_back(child);
    return nullptr;
  }

  bool operator==(const ProfileTreeNode* rhs) const {
    if (this->parent_ != rhs->parent_) {
      return false;
    }
    if (this->codeType_ != rhs->codeType_) {
      return false;
    }

    return this->getCallFrame() == rhs->getCallFrame();
  }

 private:
  /**
   *  Unique id of the node.
   */
  uint32_t id_;
  /**
   * Type of the code that is represented by this node. Either JavaScript or
   * Other.
   */
  CodeType codeType_;
  /**
   * Shared pointer to the parent node. Can be nullptr only for root node.
   */
  std::shared_ptr<ProfileTreeNode> parent_;
  /**
   * Lst of shared pointers to children nodes.
   */
  std::vector<std::shared_ptr<ProfileTreeNode>> children_;
  /**
   * Information about the corresponding call frame that is represented by this
   * node.
   */
  RuntimeSamplingProfile::SampleCallStackFrame callFrame_;
};

} // namespace facebook::react::jsinspector_modern::tracing
