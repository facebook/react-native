#import <UIKit/UIKit.h>

@interface RCTAlertController : UIAlertController

- (void)show:(BOOL)animated completion:(void (^)(void))completion;

@end