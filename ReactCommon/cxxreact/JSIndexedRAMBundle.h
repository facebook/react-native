/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <istream>
#include <memory>

#include <cxxreact/JSBigString.h>
#include <cxxreact/JSModulesUnbundle.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

class RN_EXPORT JSIndexedRAMBundle : public JSModulesUnbundle {
public:
  static std::function<std::unique_ptr<JSModulesUnbundle>(std::string)> buildFactory();

  // Throws std::runtime_error on failure.
  JSIndexedRAMBundle(const char *sourceURL);
  JSIndexedRAMBundle(std::unique_ptr<const JSBigString> script);

  // Throws std::runtime_error on failure.
  std::unique_ptr<const JSBigString> getStartupCode();
  // Throws std::runtime_error on failure.
  Module getModule(uint32_t moduleId) const override;

private:
  struct ModuleData {
    uint32_t offset;
    uint32_t length;
  };
  static_assert(
    sizeof(ModuleData) == 8,
    "ModuleData must not have any padding and use sizes matching input files");

  struct ModuleTable {
    size_t numEntries;
    std::unique_ptr<ModuleData[]> data;
    ModuleTable() : numEntries(0) {};
    ModuleTable(size_t entries) :
      numEntries(entries),
      data(std::unique_ptr<ModuleData[]>(new ModuleData[numEntries])) {};
    size_t byteLength() const {
      return numEntries * sizeof(ModuleData);
    }
  };

  void init();
  std::string getModuleCode(const uint32_t id) const;
  void readBundle(char *buffer, const std::streamsize bytes) const;
  void readBundle(
    char *buffer, const
    std::streamsize bytes,
    const std::istream::pos_type position) const;

  mutable std::unique_ptr<std::istream> m_bundle;
  ModuleTable m_table;
  size_t m_baseOffset;
  std::unique_ptr<JSBigBufferString> m_startupCode;
};

}  // namespace react
}  // namespace facebook
