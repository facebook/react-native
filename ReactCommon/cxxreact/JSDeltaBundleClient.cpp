#include "JSDeltaBundleClient.h"

#include <sstream>

#include <folly/Memory.h>

namespace facebook {
namespace react {

namespace {
  std::string startupCode(const folly::dynamic *pre, const folly::dynamic *post) {
    std::ostringstream startupCode;

    for (auto section : {pre, post}) {
      if (section != nullptr) {
        for (folly::dynamic pair : *section) {
          startupCode << pair[1].getString() << '\n';
        }
      }
    }

    return startupCode.str();
  }
} // namespace

void JSDeltaBundleClient::patch(const folly::dynamic& delta) {
  auto const reset = delta.get_ptr("reset");
  if (reset != nullptr && reset->asBool()) {
    clear();
  }

  auto const pre = delta.get_ptr("pre");
  auto const post = delta.get_ptr("post");

  if ((pre != nullptr && pre->size() > 0) || (post != nullptr && post->size() > 0)) {
    startupCode_ = startupCode(pre, post);
  }

  const folly::dynamic *modules = delta.get_ptr("delta");
  if (modules != nullptr) {
    for (const folly::dynamic pair : *modules) {
      auto id = pair[0].getInt();
      auto module = pair[1];
      if (module.isNull()) {
        modules_.erase(id);
      } else {
        modules_.emplace(id, module.getString());
      }
    }
  }
}

JSModulesUnbundle::Module JSDeltaBundleClient::getModule(uint32_t moduleId) const {
  auto search = modules_.find(moduleId);
  if (search != modules_.end()) {
    return {folly::to<std::string>(search->first, ".js"), search->second};
  }

  throw JSModulesUnbundle::ModuleNotFound(moduleId);
}

std::unique_ptr<const JSBigString> JSDeltaBundleClient::getStartupCode() const {
  return folly::make_unique<JSBigStdString>(startupCode_);
}

void JSDeltaBundleClient::clear() {
  modules_.clear();
  startupCode_.clear();
}

} // namespace react
} // namespace facebook
