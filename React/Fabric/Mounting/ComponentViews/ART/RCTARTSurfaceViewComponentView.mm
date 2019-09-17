
#import "RCTARTSurfaceViewComponentView.h"
#import <react/uimanager/ComponentDescriptorProvider.h>
#import "RCTARTSurfaceViewComponentDescriptor.h"

using namespace facebook::react;

@implementation RCTARTSurfaceViewComponentView {
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RCTARTSurfaceViewProps>();
    _props = defaultProps;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RCTARTSurfaceComponentDescriptor>();
}

@end
