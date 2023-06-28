#import "RCTViewManager.h"
#import "RCTShadowView.h"
#import "RCTDrawerView.h"

// Shadow view used for layout
@interface RCTDrawerHostShadowView : RCTShadowView

- (instancetype)initWithWidth:(NSInteger)width;

@end

@implementation RCTDrawerHostShadowView

NSInteger _width;

- (instancetype)initWithWidth:(NSInteger)width
{
  if ((self = [super init])) {
    _width = width;
  }
  
  return self;
}

- (void)insertReactSubview:(id<RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertReactSubview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[RCTShadowView class]]) {
    ((RCTShadowView *)subview).size = CGSizeMake(_width, RCTScreenSize().height);
  }
}

@end

@interface RCTDrawerViewManager : RCTViewManager

@property (nonatomic) NSInteger width;

@end

@implementation RCTDrawerViewManager

- (instancetype)init {
  if ((self = [super init])) {
    _width = 320;
  }
  return self;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (UIView *)view
{
  RCTDrawerView *view = [[RCTDrawerView alloc] initWithBridge:self.bridge];
  return view;
}

- (RCTShadowView *)shadowView
{
  return [[RCTDrawerHostShadowView alloc] initWithWidth:_width];
}

RCT_EXPORT_VIEW_PROPERTY(visible, BOOL)
RCT_CUSTOM_VIEW_PROPERTY(width, NSInteger, RCTDrawerView)
{
  _width = [RCTConvert NSInteger:json];
  view.width = _width;
}

@end

