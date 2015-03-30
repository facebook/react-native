#import "RCTVideoManager.h"
#import "RCTVideo.h"
#import "RCTBridge.h"

@implementation RCTVideoManager

@synthesize bridge = _bridge;

- (UIView *)view
{
    return [[RCTVideo alloc] initWithEventDispatcher:_bridge.eventDispatcher];
}

RCT_CUSTOM_VIEW_PROPERTY(src, NSString, RCTVideo)
{
    if (json) {
        [view initFromSource:[RCTConvert NSString:json]];
    }
}

RCT_CUSTOM_VIEW_PROPERTY(resizeMode, NSInteger, RCTVideo)
{
    [view setResizeMode:[RCTConvert NSInteger:json]];
}


@end
