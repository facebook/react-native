#pragma once

#include <memory>
#include "Bundle.h"

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

class RN_EXPORT BundleLoader {
  public:
    BundleLoader() = default;
    BundleLoader(const BundleLoader&) = delete;
    BundleLoader& operator=(const BundleLoader&) = delete;
    virtual ~BundleLoader() {};

    /**
     * Get bundle for a given full asset/file URL.
     */
    virtual std::unique_ptr<const Bundle> getBundle(std::string bundleURL) const = 0;
    /**
     * Get bundle's full asset/file URL from name.
     */
    virtual std::string getBundleURLFromName(std::string bundleName) const = 0;
};

} // react
} // facebook
