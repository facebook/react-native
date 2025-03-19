/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <forward_list>
#include <utility>

#include <yoga/enums/Display.h>

namespace facebook::yoga {

class Node;

template <typename T>
class LayoutableChildren {
 public:
  struct Iterator {
    using iterator_category = std::input_iterator_tag;
    using difference_type = std::ptrdiff_t;
    using value_type = T*;
    using pointer = T*;
    using reference = T*;

    Iterator() = default;

    Iterator(const T* node, size_t childIndex)
        : node_(node), childIndex_(childIndex) {}

    T* operator*() const {
      return node_->getChild(childIndex_);
    }

    Iterator& operator++() {
      next();
      return *this;
    }

    Iterator operator++(int) {
      Iterator tmp = *this;
      ++(*this);
      return tmp;
    }

    friend bool operator==(const Iterator& a, const Iterator& b) {
      return a.node_ == b.node_ && a.childIndex_ == b.childIndex_;
    }

    friend bool operator!=(const Iterator& a, const Iterator& b) {
      return a.node_ != b.node_ || a.childIndex_ != b.childIndex_;
    }

   private:
    void next() {
      if (childIndex_ + 1 >= node_->getChildCount()) {
        // if the current node has no more children, try to backtrack and
        // visit its successor
        if (backtrack_.empty()) [[likely]] {
          // if there are no nodes to backtrack to, the last node has been
          // visited
          *this = Iterator{};
        } else {
          // pop and restore the latest backtrack entry
          const auto& back = backtrack_.front();
          node_ = back.first;
          childIndex_ = back.second;
          backtrack_.pop_front();

          // go to the next node
          next();
        }
      } else {
        // current node has more children to visit, go to next
        ++childIndex_;
        // skip all display: contents nodes, possibly going deeper into the
        // tree
        if (node_->getChild(childIndex_)->style().display() ==
            Display::Contents) [[unlikely]] {
          skipContentsNodes();
        }
      }
    }

    void skipContentsNodes() {
      // get the node that would be returned from the iterator
      auto currentNode = node_->getChild(childIndex_);
      while (currentNode->style().display() == Display::Contents &&
             currentNode->getChildCount() > 0) {
        // if it has display: contents set, it shouldn't be returned but its
        // children should in its place push the current node and child index
        // so that the current state can be restored when backtracking
        backtrack_.push_front({node_, childIndex_});
        // traverse the child
        node_ = currentNode;
        childIndex_ = 0;

        // repeat until a node without display: contents is found in the
        // subtree or a leaf is reached
        currentNode = currentNode->getChild(childIndex_);
      }

      // if no node without display: contents was found, try to backtrack
      if (currentNode->style().display() == Display::Contents) {
        next();
      }
    }

    const T* node_{nullptr};
    size_t childIndex_{0};
    std::forward_list<std::pair<const T*, size_t>> backtrack_;

    friend LayoutableChildren;
  };

  explicit LayoutableChildren(const T* node) : node_(node) {
    static_assert(std::input_iterator<LayoutableChildren<T>::Iterator>);
    static_assert(
        std::is_base_of<Node, T>::value,
        "Type parameter of LayoutableChildren must derive from yoga::Node");
  }

  Iterator begin() const {
    if (node_->getChildCount() > 0) {
      auto result = Iterator(node_, 0);
      if (node_->getChild(0)->style().display() == Display::Contents)
          [[unlikely]] {
        result.skipContentsNodes();
      }
      return result;
    } else {
      return Iterator{};
    }
  }

  Iterator end() const {
    return Iterator{};
  }

 private:
  const T* node_;
};

} // namespace facebook::yoga
