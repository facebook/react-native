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
RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLoadingError, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)

@end
