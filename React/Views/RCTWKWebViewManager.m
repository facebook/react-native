#import "RCTViewManager.h"
#import "RCTWKWebView.h"

@interface RCTWKWebViewManager : RCTViewManager
@end

@implementation RCTWKWebViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [RCTWKWebView new];
}

RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)

@end
