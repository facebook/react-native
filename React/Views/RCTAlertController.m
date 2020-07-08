#import "RCTAlertController.h"

@interface RCTAlertController ()

@property (nonatomic, strong) UIWindow *alertWindow;

@end

@implementation RCTAlertController

- (UIWindow *)alertWindow {
    if (_alertWindow == nil) {
        _alertWindow = [[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]];
        _alertWindow.rootViewController = [UIViewController new];
        _alertWindow.windowLevel = UIWindowLevelAlert + 1;
    }
    return _alertWindow;
}

- (void)show:(BOOL)animated completion:(void (^)(void))completion {
    [self.alertWindow makeKeyAndVisible];
    [self.alertWindow.rootViewController presentViewController:self animated:animated completion:completion];
}

@end