/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TemplateRenderer.h"

#include <glog/logging.h>

#include <fabric/components/view/ViewComponentDescriptor.h>
#include <fabric/components/view/ViewProps.h>
#include <fabric/components/view/ViewShadowNode.h>
#include <fabric/core/componentDescriptor.h>
#include <fabric/core/LayoutContext.h>
#include <fabric/core/ShadowNodeFragment.h>
#include <fabric/debug/DebugStringConvertible.h>
#include <fabric/debug/DebugStringConvertibleItem.h>
#include <folly/json.h>

namespace facebook {
  namespace react {
    SharedShadowNode TemplateRenderer::buildShadowTree(const std::string &jsonStr, int rootTag, const folly::dynamic &params, const ComponentDescriptorRegistry &componentDescriptorRegistry) {
      LOG(INFO) << "(strt) TemplateRenderer inject hardcoded 'server rendered' view tree";
      std::string content = jsonStr;
      for (const auto& param : params.items()) {
        const auto& key = param.first.asString();
        size_t start_pos = content.find(key);
        if(start_pos != std::string::npos) {
          content.replace(start_pos, key.length(), param.second.asString());
        }
      }
      auto json = folly::parseJson(content);
      std::vector<SharedShadowNode> nodes;
      nodes.resize(json.size() * 2);
      int tagOffset = 4560; // MAYBE TODO: use number of existing tags so they don't collide rather than random value
      for (const auto& command : json) {
        if (command[0] == "createNode") {
          int tag = command[1].asInt();
          const auto& type = command[2].asString();
          const auto& props = command[3];
          nodes[tag] = componentDescriptorRegistry.createNode(tag + tagOffset, type, rootTag, props, nullptr);
        } else if (command[0] == "appendChild") {
          auto parentShadowNode = nodes[command[1].asInt()];
          const SharedComponentDescriptor &componentDescriptor = componentDescriptorRegistry[parentShadowNode];
          componentDescriptor->appendChild(parentShadowNode, nodes[command[2].asInt()]);
        } else if (command[0] == "childSetNode") {
          LOG(INFO) << "(stop) TemplateView inject serialized 'server rendered' view tree";
          return nodes[command[1].asInt()];
        }
      }
      throw std::runtime_error("Missing childSetNode command in template content:\n" + content);
      return SharedShadowNode {};
    }
  }
}
