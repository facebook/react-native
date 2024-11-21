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

using namespace facebook;
using namespace facebook::react;


// We have to inherit from ViewProps so that we can
class CustomViewProps final : public ViewProps {
public:
  CustomViewProps() = default;
  CustomViewProps(const PropsParserContext& context, const CustomViewProps &sourceProps, const RawProps &rawProps): ViewProps(context, sourceProps, rawProps) {
    if (rawProps.isEmpty()) {
      return;
    }
    
    const RawValue* raw = rawProps.at("nativeProp", nullptr, nullptr);
    jsi::Runtime* runtime = raw->getRuntime();
    const jsi::Value& nativePropValue = raw->getJsiValue();
    jsi::String nativePropString = nativePropValue.getString(*runtime);
    nativeProp = nativePropString.utf8(*runtime);
  }
  
  std::string nativeProp;
};

class CustomViewState {
public:
  CustomViewState() = default;
};

class JsiPropParser final : public RawPropsParserInterface {
public:
  template <typename PropsT>
  void prepare() noexcept {}
  
  void preparse(const RawProps& rawProps) const noexcept override {
  }
  
  void postPrepare() noexcept override {
    
  }
  
  // This is called on every prop update for _every_ prop
  const RawValue* at(const RawProps& rawProps, const RawPropsKey& key) const noexcept override {
    std::string nameStr = static_cast<std::string>(key); // TODO: this uses render() which is a memcpy, optimize for perf
    const char* name = nameStr.c_str();
    
    NSLog(@"Processing prop %s", name);
    jsi::Runtime* runtime = getRuntime(rawProps);
    jsi::Value jsiValue = getJsiValue(rawProps).getObject(*runtime).getProperty(*runtime, name);
    
    if (nameStr != "nativeProp") {
      return new RawValue(jsi::dynamicFromValue(*runtime, jsiValue));
    }
    
//    delete name;
//    delete length;
    
    return new RawValue(runtime, jsiValue);
  }
  
private:
  // Either store JSI or raw value here, not sure whats best
//  std::unordered_map<std::string, RawValue> values_;
};

extern const char CustomViewComponentName[] = "CustomView";
using ComponentShadowNode = ConcreteViewShadowNode<
  CustomViewComponentName,
  CustomViewProps,
  ViewEventEmitter, // default one
  CustomViewState
>;
using CustomViewComponentDescriptor = ConcreteComponentDescriptor<ComponentShadowNode, JsiPropParser>;

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

- (void)updateProps:(const facebook::react::Props::Shared &)props oldProps:(const facebook::react::Props::Shared &)oldProps {
  const auto &newViewProps = *std::static_pointer_cast<CustomViewProps const>(props);
  NSLog(@"NativeProp value: %s", newViewProps.nativeProp.c_str());
  
  [super updateProps:props oldProps:oldProps];
}

@end
