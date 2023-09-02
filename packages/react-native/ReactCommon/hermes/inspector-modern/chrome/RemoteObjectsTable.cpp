/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RemoteObjectsTable.h"

#include <cstdlib>

#include <folly/Conv.h>

namespace {

bool isScopeId(int64_t id) {
  return id < 0;
}

bool isValueId(int64_t id) {
  return id > 0;
}

std::string toObjId(int64_t id) {
  return folly::to<std::string>(id);
}

int64_t toId(const std::string &objId) {
  return atoll(objId.c_str());
}

} // namespace

namespace facebook {
namespace hermes {
namespace inspector_modern {
namespace chrome {

const char *BacktraceObjectGroup = "backtrace";

const char *ConsoleObjectGroup = "console";

RemoteObjectsTable::RemoteObjectsTable() = default;

RemoteObjectsTable::~RemoteObjectsTable() = default;

std::string RemoteObjectsTable::addScope(
    std::pair<uint32_t, uint32_t> frameAndScopeIndex,
    const std::string &objectGroup) {
  int64_t id = scopeId_--;
  scopes_[id] = frameAndScopeIndex;

  if (!objectGroup.empty()) {
    idToGroup_[id] = objectGroup;
    groupToIds_[objectGroup].push_back(id);
  }

  return toObjId(id);
}

std::string RemoteObjectsTable::addValue(
    ::facebook::jsi::Value value,
    const std::string &objectGroup) {
  int64_t id = valueId_++;
  values_[id] = std::move(value);

  if (!objectGroup.empty()) {
    idToGroup_[id] = objectGroup;
    groupToIds_[objectGroup].push_back(id);
  }

  return toObjId(id);
}

const std::pair<uint32_t, uint32_t> *RemoteObjectsTable::getScope(
    const std::string &objId) const {
  int64_t id = toId(objId);
  if (!isScopeId(id)) {
    return nullptr;
  }

  auto it = scopes_.find(id);
  if (it == scopes_.end()) {
    return nullptr;
  }

  return &it->second;
}

const ::facebook::jsi::Value *RemoteObjectsTable::getValue(
    const std::string &objId) const {
  int64_t id = toId(objId);
  if (!isValueId(id)) {
    return nullptr;
  }

  auto it = values_.find(id);
  if (it == values_.end()) {
    return nullptr;
  }

  return &it->second;
}

std::string RemoteObjectsTable::getObjectGroup(const std::string &objId) const {
  int64_t id = toId(objId);

  auto it = idToGroup_.find(id);
  if (it == idToGroup_.end()) {
    return "";
  }

  return it->second;
}

void RemoteObjectsTable::releaseObject(int64_t id) {
  if (isScopeId(id)) {
    scopes_.erase(id);
  } else if (isValueId(id)) {
    values_.erase(id);
  }
}

void RemoteObjectsTable::releaseObject(const std::string &objId) {
  int64_t id = toId(objId);
  releaseObject(id);
}

void RemoteObjectsTable::releaseObjectGroup(const std::string &objectGroup) {
  auto it = groupToIds_.find(objectGroup);
  if (it == groupToIds_.end()) {
    return;
  }

  const auto &ids = it->second;
  for (int64_t id : ids) {
    releaseObject(id);
  }

  groupToIds_.erase(it);
}

} // namespace chrome
} // namespace inspector_modern
} // namespace hermes
} // namespace facebook
