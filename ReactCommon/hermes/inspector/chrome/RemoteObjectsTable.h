// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cstdint>
#include <unordered_map>
#include <utility>
#include <vector>

#include <jsi/jsi.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {

/// Well-known object group names

/**
 * Objects created as a result of the Debugger.paused notification (e.g. scope
 * objects) are placed in the "backtrace" object group. This object group is
 * cleared when the VM resumes.
 */
extern const char *BacktraceObjectGroup;

/**
 * Objects that are created as a result of a console evaluation are placed in
 * the "console" object group. This object group is cleared when the client
 * clears the console.
 */
extern const char *ConsoleObjectGroup;

/**
 * RemoteObjectsTable manages the mapping of string object ids to scope metadata
 * or actual JSI objects. The debugger vends these ids to the client so that the
 * client can perform operations on the ids (e.g. enumerate properties on the
 * object backed by the id). See Runtime.RemoteObjectId in the CDT docs for
 * more details.
 *
 * Note that object handles are not ref-counted. Suppose an object foo is mapped
 * to object id "objId" and is also in object group "objGroup". Then *either* of
 * `releaseObject("objId")` or `releaseObjectGroup("objGroup")` will remove foo
 * from the table. This matches the behavior of object groups in CDT.
 */
class RemoteObjectsTable {
 public:
  RemoteObjectsTable();
  ~RemoteObjectsTable();

  RemoteObjectsTable(const RemoteObjectsTable &) = delete;
  RemoteObjectsTable &operator=(const RemoteObjectsTable &) = delete;

  /**
   * addScope adds the provided (frameIndex, scopeIndex) mapping to the table.
   * If objectGroup is non-empty, then the scope object is also added to that
   * object group for releasing via releaseObjectGroup. Returns an object id.
   */
  std::string addScope(
      std::pair<uint32_t, uint32_t> frameAndScopeIndex,
      const std::string &objectGroup);

  /**
   * addValue adds the JSI value to the table. If objectGroup is non-empty, then
   * the scope object is also added to that object group for releasing via
   * releaseObjectGroup. Returns an object id.
   */
  std::string addValue(
      ::facebook::jsi::Value value,
      const std::string &objectGroup);

  /**
   * Retrieves the (frameIndex, scopeIndex) associated with this object id, or
   * nullptr if no mapping exists. The pointer stays valid as long as you only
   * call const methods on this class.
   */
  const std::pair<uint32_t, uint32_t> *getScope(const std::string &objId) const;

  /**
   * Retrieves the JSI value associated with this object id, or nullptr if no
   * mapping exists. The pointer stays valid as long as you only call const
   * methods on this class.
   */
  const ::facebook::jsi::Value *getValue(const std::string &objId) const;

  /**
   * Retrieves the object group that this object id is in, or empty string if it
   * isn't in an object group. The returned pointer is only guaranteed to be
   * valid until the next call to this class.
   */
  std::string getObjectGroup(const std::string &objId) const;

  /**
   * Removes the scope or JSI value backed by the provided object ID from the
   * table.
   */
  void releaseObject(const std::string &objId);

  /**
   * Removes all objects that are part of the provided object group from the
   * table.
   */
  void releaseObjectGroup(const std::string &objectGroup);

 private:
  void releaseObject(int64_t id);

  int64_t scopeId_ = -1;
  int64_t valueId_ = 1;

  std::unordered_map<int64_t, std::pair<uint32_t, uint32_t>> scopes_;
  std::unordered_map<int64_t, ::facebook::jsi::Value> values_;
  std::unordered_map<int64_t, std::string> idToGroup_;
  std::unordered_map<std::string, std::vector<int64_t>> groupToIds_;
};

} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
