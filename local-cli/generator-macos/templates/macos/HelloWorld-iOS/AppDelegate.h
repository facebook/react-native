#import <React/RCTBridgeDelegate.h>
#import <React/RCTUIKit.h> // [macOS]

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>

@property (nonatomic, strong) UIWindow *window;

@end
