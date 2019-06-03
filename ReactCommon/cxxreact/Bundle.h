#pragma once

#include <folly/Portability.h>
#include <memory>
#include "JSBigString.h"

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

/**
 * BundleHeader
 *
 * RAM bundles and BC bundles begin with headers. For RAM bundles this is
 * 4 bytes, for BC bundles this is 12 bytes. This structure holds the first 12
 * bytes from a bundle in a way that gives access to that information.
 */
FOLLY_PACK_PUSH
struct FOLLY_PACK_ATTR BundleHeader {
  BundleHeader() {
    std::memset(this, 0, sizeof(BundleHeader));
  }

  uint32_t magic;
  uint32_t reserved_;
  uint32_t version;
};
FOLLY_PACK_POP

enum class RN_EXPORT BundleType : unsigned int {
  BasicBundle = 0,
  IndexedRAMBundle = 1,
  FileRAMBundle = 2,
  DeltaBundle = 3,
  BCBundle = 4, // NOTE: what is this? is it used anywhere?
};

class RN_EXPORT Bundle {
  public:
    /**
     * Takes the first 8 bytes of a bundle, and returns a tag describing the
     * bundle's format.
     */
    static BundleType parseTypeFromHeader(const BundleHeader& header);
    /**
     * Convert an `BundleType` enum into a string, useful for emitting in errors
     * and diagnostic messages.
     */
    static const char* stringForBundleType(const BundleType& type);

    Bundle() = default;
    Bundle(const Bundle&) = delete;
    Bundle& operator=(const Bundle&) = delete;
    virtual ~Bundle() {};

    /**
     * URL with filename from where the source code is comming from.
     * Use it for stack traces.
     */
    virtual std::string getSourceURL() const = 0;
    virtual BundleType getBundleType() const = 0;
};

} // react
} // facebook
