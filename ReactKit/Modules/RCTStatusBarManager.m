#import "RCTStatusBarManager.h"

@implementation RCTStatusBarManager

- (void)setStatusBarStyle:(NSNumber *)statusBarStyle animated:(NSNumber *)animated {
  RCT_EXPORT();

  dispatch_async(dispatch_get_main_queue(), ^{
    [[UIApplication sharedApplication]
     setStatusBarStyle:[statusBarStyle intValue]
     animated:[animated boolValue]];
  });
}

- (void)setStatusBarHidden:(NSNumber *)hidden withAnimation:(NSNumber *)animation {
  RCT_EXPORT();

  dispatch_async(dispatch_get_main_queue(), ^{
    [[UIApplication sharedApplication]
      setStatusBarHidden:[hidden boolValue]
      withAnimation:[animation intValue]];
  });
}

@end
