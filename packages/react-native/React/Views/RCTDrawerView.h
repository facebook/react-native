
#import <UIKit/UIKit.h>
#import "RCTInvalidating.h"

@class RCTBridge;

@interface RCTDrawerView : UIView <RCTInvalidating, UISplitViewControllerDelegate>

@property (nonatomic, assign) BOOL visible;
@property (nonatomic, assign) NSInteger width;

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end
