/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LongLivedObject.h"

namespace facebook {
namespace react {

// LongLivedObjectCollection
LongLivedObjectCollection &LongLivedObjectCollection::get() {
  static LongLivedObjectCollection instance;
  return instance;
}

LongLivedObjectCollection::LongLivedObjectCollection() {}

void LongLivedObjectCollection::add(std::shared_ptr<LongLivedObject> so) const {
  std::lock_guard<std::mutex> lock(collectionMutex_);
  collection_.insert(so);
}

void LongLivedObjectCollection::remove(const LongLivedObject *o) const {
  std::lock_guard<std::mutex> lock(collectionMutex_);
  auto p = collection_.begin();
  for (; p != collection_.end(); p++) {
    if (p->get() == o) {
      break;
    }
  }
  if (p != collection_.end()) {
    collection_.erase(p);
  }
}

void LongLivedObjectCollection::clear() const {
  std::lock_guard<std::mutex> lock(collectionMutex_);
  collection_.clear();
}

size_t LongLivedObjectCollection::size() const {
  std::lock_guard<std::mutex> lock(collectionMutex_);
  return collection_.size();
}

// LongLivedObject
LongLivedObject::LongLivedObject() {}
LongLivedObject::~LongLivedObject() {}

void LongLivedObject::allowRelease() {
  LongLivedObjectCollection::get().remove(this);
}

} // namespace react
} // namespace facebook
