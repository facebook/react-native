// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cstdint>
#include <cstring>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

/*
 * ScriptTag
 *
 * Scripts given to the JS Executors to run could be in any of the following
 * formats. They are tagged so the executor knows how to run them.
 */
enum struct ScriptTag {
  String = 0,
  RAMBundle,
  BCBundle,
};

/**
 * BundleHeader
 *
 * RAM bundles and BC bundles begin with headers. For RAM bundles this is
 * 4 bytes, for BC bundles this is 12 bytes. This structure holds the first 12
 * bytes from a bundle in a way that gives access to that information.
 */
struct __attribute__((packed)) BundleHeader {
  BundleHeader() {
    std::memset(this, 0, sizeof(BundleHeader));
  }

  uint32_t magic;
  uint32_t reserved_;
  uint32_t version;
};

/**
 * parseTypeFromHeader
 *
 * Takes the first 8 bytes of a bundle, and returns a tag describing the
 * bundle's format.
 */
RN_EXPORT ScriptTag parseTypeFromHeader(const BundleHeader& header);

/**
 * stringForScriptTag
 *
 * Convert an `ScriptTag` enum into a string, useful for emitting in errors
 * and diagnostic messages.
 */
RN_EXPORT const char* stringForScriptTag(const ScriptTag& tag);

}  // namespace react
}  // namespace facebook
