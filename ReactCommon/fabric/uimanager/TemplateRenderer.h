/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <folly/dynamic.h>

#include <fabric/core/ShadowNode.h>
#include <fabric/uimanager/ComponentDescriptorRegistry.h>
#include <fabric/uimanager/UIManagerDelegate.h>

namespace facebook {
  namespace react {
    class TemplateRenderer {
    public:
      static SharedShadowNode buildShadowTree(const std::string &jsonStr, int rootTag, const folly::dynamic &params, const ComponentDescriptorRegistry &componentDescriptorRegistry);
    };
  } // react
} // facebook
