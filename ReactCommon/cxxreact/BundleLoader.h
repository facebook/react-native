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

    virtual std::unique_ptr<const Bundle> getBundle(std::string assetURL) const = 0;
};

} // react
} // facebook
