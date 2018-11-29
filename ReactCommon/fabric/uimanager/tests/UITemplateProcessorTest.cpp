/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <exception>

#include <gtest/gtest.h>
#include <react/uimanager/ComponentDescriptorFactory.h>
#include <react/uimanager/UITemplateProcessor.h>

using namespace facebook::react;

#include <react/components/activityindicator/ActivityIndicatorViewComponentDescriptor.h>
#include <react/components/image/ImageComponentDescriptor.h>
#include <react/components/scrollview/ScrollViewComponentDescriptor.h>
#include <react/components/text/ParagraphComponentDescriptor.h>
#include <react/components/text/RawTextComponentDescriptor.h>
#include <react/components/text/TextComponentDescriptor.h>
#include <react/components/view/ViewComponentDescriptor.h>
#include <react/uimanager/ComponentDescriptorRegistry.h>

namespace facebook {
namespace react {

SharedComponentDescriptorRegistry ComponentDescriptorFactory::buildRegistry(
    const SharedEventDispatcher &eventDispatcher,
    const SharedContextContainer &contextContainer) {
  auto registry = std::make_shared<ComponentDescriptorRegistry>();
  registry->registerComponentDescriptor(
      std::make_shared<ViewComponentDescriptor>(eventDispatcher));
  registry->registerComponentDescriptor(
      std::make_shared<ImageComponentDescriptor>(
          eventDispatcher, contextContainer));
  registry->registerComponentDescriptor(
      std::make_shared<ScrollViewComponentDescriptor>(eventDispatcher));
  registry->registerComponentDescriptor(
      std::make_shared<ParagraphComponentDescriptor>(
          eventDispatcher, contextContainer));
  registry->registerComponentDescriptor(
      std::make_shared<TextComponentDescriptor>(eventDispatcher));
  registry->registerComponentDescriptor(
      std::make_shared<RawTextComponentDescriptor>(eventDispatcher));
  registry->registerComponentDescriptor(
      std::make_shared<ActivityIndicatorViewComponentDescriptor>(
          eventDispatcher));
  return registry;
}

bool mockSimpleTestValue_;

NativeModuleRegistry buildNativeModuleRegistry();

NativeModuleRegistry buildNativeModuleRegistry() {
  NativeModuleRegistry nMR;
  nMR.registerModule(
      "MobileConfig",
      [&](const std::string &methodName, const folly::dynamic &args) {
        return mockSimpleTestValue_;
      });
  return nMR;
}

} // namespace react
} // namespace facebook

TEST(UITemplateProcessorTest, testSimpleBytecode) {
  auto surfaceId = 11;
  auto componentDescriptorRegistry =
      ComponentDescriptorFactory::buildRegistry(nullptr, nullptr);
  auto nativeModuleRegistry = buildNativeModuleRegistry();

  auto bytecode = R"delim({"version":0.1,"commands":[
    ["createNode",2,"RCTView",-1,{"opacity": 0.5, "testId": "root"}],
    ["createNode",4,"RCTView",2,{"testId": "child"}],
    ["returnRoot",2]
  ]})delim";

  mockSimpleTestValue_ = true;

  auto root1 = UITemplateProcessor::buildShadowTree(
      bytecode,
      surfaceId,
      folly::dynamic::object(),
      *componentDescriptorRegistry,
      nativeModuleRegistry);
  LOG(INFO) << std::endl << root1->getDebugDescription();
  auto props1 = std::dynamic_pointer_cast<const ViewProps>(root1->getProps());
  ASSERT_NEAR(props1->opacity, 0.5, 0.001);
  ASSERT_STREQ(props1->testId.c_str(), "root");
  auto children1 = root1->getChildren();
  ASSERT_EQ(children1.size(), 1);
  auto child_props1 =
      std::dynamic_pointer_cast<const ViewProps>(children1.at(0)->getProps());
  ASSERT_STREQ(child_props1->testId.c_str(), "child");
}

TEST(UITemplateProcessorTest, testConditionalBytecode) {
  auto surfaceId = 11;
  auto componentDescriptorRegistry =
      ComponentDescriptorFactory::buildRegistry(nullptr, nullptr);
  auto nativeModuleRegistry = buildNativeModuleRegistry();

  auto bytecode = R"delim({"version":0.1,"commands":[
    ["createNode",2,"RCTView",-1,{"testId": "root"}],
    ["loadNativeBool",1,"MobileConfig","getBool",["qe:simple_test"]],
    ["conditional",1,
      [["createNode",4,"RCTView",2,{"testId": "cond_true"}]],
      [["createNode",4,"RCTView",2,{"testId": "cond_false"}]]
    ],
    ["returnRoot",2]
  ]})delim";

  mockSimpleTestValue_ = true;

  auto root1 = UITemplateProcessor::buildShadowTree(
      bytecode,
      surfaceId,
      folly::dynamic::object(),
      *componentDescriptorRegistry,
      nativeModuleRegistry);
  LOG(INFO) << std::endl << root1->getDebugDescription();
  auto props1 = std::dynamic_pointer_cast<const ViewProps>(root1->getProps());
  ASSERT_STREQ(props1->testId.c_str(), "root");
  auto children1 = root1->getChildren();
  ASSERT_EQ(children1.size(), 1);
  auto child_props1 =
      std::dynamic_pointer_cast<const ViewProps>(children1.at(0)->getProps());
  ASSERT_STREQ(child_props1->testId.c_str(), "cond_true");

  mockSimpleTestValue_ = false;

  auto root2 = UITemplateProcessor::buildShadowTree(
      bytecode,
      surfaceId,
      folly::dynamic::object(),
      *componentDescriptorRegistry,
      nativeModuleRegistry);
  auto child_props2 = std::dynamic_pointer_cast<const ViewProps>(
      root2->getChildren().at(0)->getProps());
  ASSERT_STREQ(child_props2->testId.c_str(), "cond_false");
}
