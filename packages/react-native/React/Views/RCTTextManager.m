#import "RCTTextManager.h"
#import "RCTTextView.h"

@implementation RCTTextManager

RCT_EXPORT_MODULE()

// Existing properties...
RCT_EXPORT_VIEW_PROPERTY(text, NSString)
RCT_EXPORT_VIEW_PROPERTY(dynamicTypeEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(textStyle, NSString)

- (UIView *)view
{
  return [RCTTextView new];
}

@end