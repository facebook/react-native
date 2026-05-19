/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <optional>
#include <unordered_map>
#include "TinyMap.h"

namespace facebook::react {

/**
 * A facade that delegates to either TinyMap or std::unordered_map based on
 * the useUnorderedMapInDifferentiator feature flag. This allows safe rollout
 * of the unordered_map change in the Differentiator.
 *
 * Exposes a subset of the std::unordered_map interface used by the
 * Differentiator: find, insert, erase, begin, end, and range-for.
 *
 * The Iterator returns const references because it uses a cached copy
 * internally (the two backends have different pair types). The Differentiator
 * only reads through iterators, never writes.
 */
template <typename KeyT, typename ValueT>
class DiffMap final {
 public:
  using Pair = std::pair<KeyT, ValueT>;

  class Iterator {
   public:
    const Pair &operator*() const
    {
      syncCached();
      return cached_;
    }

    const Pair *operator->() const
    {
      syncCached();
      return &cached_;
    }

    Iterator &operator++()
    {
      if (useUnorderedMap_) {
        ++umIt_;
      } else {
        ++tinyIt_;
      }
      dirty_ = true;
      return *this;
    }

    bool operator==(const Iterator &other) const
    {
      if (useUnorderedMap_) {
        return umIt_ == other.umIt_;
      }
      return tinyIt_ == other.tinyIt_;
    }

    bool operator!=(const Iterator &other) const
    {
      return !(*this == other);
    }

   private:
    friend class DiffMap;

    void syncCached() const
    {
      if (!dirty_) {
        return;
      }
      if (useUnorderedMap_) {
        cached_ = {umIt_->first, umIt_->second};
      } else {
        cached_ = {tinyIt_->first, tinyIt_->second};
      }
      dirty_ = false;
    }

    bool useUnorderedMap_{false};
    typename TinyMap<KeyT, ValueT>::Iterator tinyIt_{nullptr};
    typename std::unordered_map<KeyT, ValueT>::iterator umIt_{};
    mutable Pair cached_{};
    mutable bool dirty_{true};
  };

  DiffMap() : useUnorderedMap_(ReactNativeFeatureFlags::useUnorderedMapInDifferentiator())
  {
    if (useUnorderedMap_) {
      unorderedMap_.emplace();
    }
  }

  explicit DiffMap(size_t sizeHint) : useUnorderedMap_(ReactNativeFeatureFlags::useUnorderedMapInDifferentiator())
  {
    if (useUnorderedMap_) {
      unorderedMap_.emplace();
      unorderedMap_->reserve(sizeHint);
    }
  }

  Iterator begin()
  {
    Iterator it;
    it.useUnorderedMap_ = useUnorderedMap_;
    if (useUnorderedMap_) {
      it.umIt_ = unorderedMap_->begin();
    } else {
      it.tinyIt_ = tinyMap_.begin();
    }
    return it;
  }

  Iterator end()
  {
    Iterator it;
    it.useUnorderedMap_ = useUnorderedMap_;
    if (useUnorderedMap_) {
      it.umIt_ = unorderedMap_->end();
    } else {
      it.tinyIt_ = tinyMap_.end();
    }
    return it;
  }

  Iterator find(KeyT key)
  {
    Iterator it;
    it.useUnorderedMap_ = useUnorderedMap_;
    if (useUnorderedMap_) {
      it.umIt_ = unorderedMap_->find(key);
    } else {
      it.tinyIt_ = tinyMap_.find(key);
    }
    return it;
  }

  void insert(Pair pair)
  {
    if (useUnorderedMap_) {
      unorderedMap_->insert(std::move(pair));
    } else {
      tinyMap_.insert(std::move(pair));
    }
  }

  void erase(Iterator it)
  {
    if (useUnorderedMap_) {
      unorderedMap_->erase(it.umIt_);
    } else {
      tinyMap_.erase(it.tinyIt_);
    }
  }

 private:
  bool useUnorderedMap_;
  TinyMap<KeyT, ValueT> tinyMap_;
  std::optional<std::unordered_map<KeyT, ValueT>> unorderedMap_;
};

} // namespace facebook::react
