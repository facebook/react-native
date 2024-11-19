//
//  ManualFabricComponentView.mm
//  RNTesterPods
//
//  Created by Hanno Gödecke on 19.11.2024.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>
#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#import <React/RCTComponentViewFactory.h>
#import <React/UIView+ComponentViewProtocol.h>

#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/components/view/ViewEventEmitter.h>
#import <React/RCTViewComponentView.h>
#import <jsi/jsi.h>

using namespace facebook::react;


// We have to inherit from ViewProps so that we can
class CustomViewProps final : public ViewProps {
public:
  CustomViewProps() = default; // Not sure if delete is allowed?
  CustomViewProps(const PropsParserContext& context, const CustomViewProps &sourceProps, const RawProps &rawProps): ViewProps(context, sourceProps, rawProps), nativeProp(rawProps.isEmpty() ? facebook::jsi::Value() : std::move(rawProps.jsiValueAt("nativeProp"))) {}
  
  facebook::jsi::Value nativeProp;
};

class CustomViewState {
public:
  CustomViewState() = default;
};

extern const char CustomViewComponentName[] = "CustomView";
using ComponentShadowNode = ConcreteViewShadowNode<
  CustomViewComponentName,
  CustomViewProps,
  ViewEventEmitter, // default one
  CustomViewState
>;
using CustomViewComponentDescriptor = ConcreteComponentDescriptor<ComponentShadowNode>;

@interface ManualFabricComponentView : RCTViewComponentView //UIView <RCTComponentViewProtocol>

@end

@implementation ManualFabricComponentView

// Adds the component to the known components
+(void)load
{
  [RCTComponentViewFactory.currentComponentViewFactory registerComponentViewClass:[ManualFabricComponentView class]];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<CustomViewComponentDescriptor>();
}

@end
