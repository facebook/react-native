#include <cstdint>
#include <vector>

#include <yoga/enums/Display.h>

namespace facebook::yoga {

class Node;

template <typename T>
class LayoutableChildren {
 public:
  using Backtrack = std::vector<std::pair<const T*, size_t>>;
  struct Iterator {
    using iterator_category = std::input_iterator_tag;
    using difference_type = std::ptrdiff_t;
    using value_type = T*;
    using pointer = T*;
    using reference = T*;

    Iterator(const T* node, size_t childIndex)
        : node_(node), childIndex_(childIndex) {}
    Iterator(const T* node, size_t childIndex, Backtrack&& backtrack)
        : node_(node),
          childIndex_(childIndex),
          backtrack_(std::move(backtrack)) {}

    T* operator*() const {
      return node_->getChild(childIndex_);
    }

    Iterator& operator++() {
      next();
      currentNodeIndex_++;
      return *this;
    }

    Iterator operator++(int) {
      Iterator tmp = *this;
      ++(*this);
      return tmp;
    }

    size_t index() const {
      return currentNodeIndex_;
    }

    friend bool operator==(const Iterator& a, const Iterator& b) {
      return a.node_ == b.node_ && a.childIndex_ == b.childIndex_;
    };

    friend bool operator!=(const Iterator& a, const Iterator& b) {
      return a.node_ != b.node_ || a.childIndex_ != b.childIndex_;
    };

   private:
    void next() {
      if (childIndex_ + 1 >= node_->getChildCount()) {
        // if the current node has no more children, try to backtrack and
        // visit its successor
        if (backtrack_.empty()) {
          // if there are no nodes to backtrack to, the last node has been
          // visited
          node_ = nullptr;
          childIndex_ = SIZE_MAX;
        } else {
          // pop and restore the latest backtrack entry
          const auto back = backtrack_.back();
          backtrack_.pop_back();
          node_ = back.first;
          childIndex_ = back.second;

          // go to the next node
          next();
        }
      } else {
        // current node has more children to visit, go to next
        ++childIndex_;
        // skip all display: contents nodes, possibly going deeper into the
        // tree
        skipContentsNodes();
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
        backtrack_.push_back({node_, childIndex_});
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

    const T* node_;
    size_t childIndex_;
    size_t currentNodeIndex_{0};
    Backtrack backtrack_;

    friend LayoutableChildren;
  };

  LayoutableChildren(const T* node) : node_(node) {
    static_assert(std::input_iterator<LayoutableChildren<T>::Iterator>);
    static_assert(
        std::is_base_of<Node, T>::value,
        "Type parameter of LayoutableChildren must derive from yoga::Node");
  }

  Iterator begin() const {
    if (node_->getChildCount() > 0) {
      auto result = Iterator(node_, 0);
      result.skipContentsNodes();
      return result;
    } else {
      return Iterator(nullptr, SIZE_MAX);
    }
  }

  Iterator end() const {
    return Iterator(nullptr, SIZE_MAX);
  }

 private:
  const T* node_;
};

} // namespace facebook::yoga
