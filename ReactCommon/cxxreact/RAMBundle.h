#pragma once

#include "Bundle.h"
#include "JSBigString.h"

namespace facebook {
namespace react {

class RAMBundle : public Bundle {
  public:
    class ModuleNotFound : public std::out_of_range {
    public:
      using std::out_of_range::out_of_range;
      ModuleNotFound(uint32_t moduleId) : std::out_of_range::out_of_range(
        folly::to<std::string>("Module not found: ", moduleId)) {}
    };
    struct Module {
      std::string name;
      std::string code;
    };

    RAMBundle() = default;
    RAMBundle(const RAMBundle&) = delete;
    RAMBundle& operator=(const RAMBundle&) = delete;
    virtual ~RAMBundle() {};

    /**
     * Path to a main bundle file (eg: `index.android.bundle`).
     * For FileRAMBundle sourcePath will be different than sourceURL.
     */
    virtual std::string getSourcePath() const = 0;
    virtual std::unique_ptr<const JSBigString> getStartupScript() const = 0;
    virtual Module getModule(uint32_t moduleId, const char* bundlePrefix) const = 0;
};

} // react
} // facebook
