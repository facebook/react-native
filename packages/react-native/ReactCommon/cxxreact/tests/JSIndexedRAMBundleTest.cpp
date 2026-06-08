/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cstdint>
#include <memory>
#include <string>

#include <cxxreact/JSBigString.h>
#include <cxxreact/JSIndexedRAMBundle.h>
#include <gtest/gtest.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

using namespace facebook::react;

namespace {
constexpr uint32_t kRAMBundleMagic = 0xFB0BD1E5;

void appendLittleEndian32(std::string& out, uint32_t value) {
  out.push_back(static_cast<char>(value & 0xFF));
  out.push_back(static_cast<char>((value >> 8) & 0xFF));
  out.push_back(static_cast<char>((value >> 16) & 0xFF));
  out.push_back(static_cast<char>((value >> 24) & 0xFF));
}

void appendNullTerminatedSection(std::string& out, const std::string& section) {
  out += section;
  out.push_back('\0');
}
} // namespace

TEST(JSIndexedRAMBundleTest, ReadsLittleEndianStartupAndModules) {
  const std::string startup = "var startup = true;";
  const std::string moduleZero = "module zero code";
  const std::string moduleOne = "m1";

  const auto startupCodeSize = static_cast<uint32_t>(startup.size() + 1);
  const auto lengthZero = static_cast<uint32_t>(moduleZero.size() + 1);
  const auto lengthOne = static_cast<uint32_t>(moduleOne.size() + 1);
  const uint32_t offsetZero = startupCodeSize;
  const uint32_t offsetOne = offsetZero + lengthZero;

  std::string bundle;
  appendLittleEndian32(bundle, kRAMBundleMagic);
  appendLittleEndian32(bundle, 2);
  appendLittleEndian32(bundle, startupCodeSize);
  appendLittleEndian32(bundle, offsetZero);
  appendLittleEndian32(bundle, lengthZero);
  appendLittleEndian32(bundle, offsetOne);
  appendLittleEndian32(bundle, lengthOne);
  appendNullTerminatedSection(bundle, startup);
  appendNullTerminatedSection(bundle, moduleZero);
  appendNullTerminatedSection(bundle, moduleOne);

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
  JSIndexedRAMBundle ramBundle(std::make_unique<JSBigStdString>(bundle));

  const auto startupCode = ramBundle.getStartupCode();
  EXPECT_EQ(std::string(startupCode->c_str(), startupCode->size()), startup);

  const auto firstModule = ramBundle.getModule(0);
  EXPECT_EQ(firstModule.name, "0.js");
  EXPECT_EQ(firstModule.code, moduleZero);

  const auto secondModule = ramBundle.getModule(1);
  EXPECT_EQ(secondModule.name, "1.js");
  EXPECT_EQ(secondModule.code, moduleOne);
#pragma GCC diagnostic pop
}

#endif // RCT_REMOVE_LEGACY_ARCH
