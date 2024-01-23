#import "RCTReactViewController.h"
#import <React/RCTConstants.h>

@protocol RCTRootViewFactoryProtocol <NSObject>

- (UIView *)viewWithModuleName:(NSString *)moduleName initialProperties:(NSDictionary*)initialProperties launchOptions:(NSDictionary*)launchOptions;

@end

@implementation RCTReactViewController

- (instancetype)initWithModuleName:(NSString *)moduleName initProps:(NSDictionary *)initProps {
    if (self = [super init]) {
        _moduleName = moduleName;
        _initialProps = initProps;
    }
    return self;
}

- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator {
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTWindowFrameDidChangeNotification object:self];
}

// TODO: Temporary solution for creating RCTRootView on demand. This should be done through factory pattern, see here: https://github.com/facebook/react-native/pull/42263
- (void)loadView {
    id<UIApplicationDelegate> appDelegate = [UIApplication sharedApplication].delegate;
    if ([appDelegate respondsToSelector:@selector(viewWithModuleName:initialProperties:launchOptions:)]) {
        id<RCTRootViewFactoryProtocol> delegate = (id<RCTRootViewFactoryProtocol>)appDelegate;
        self.view = [delegate viewWithModuleName:_moduleName initialProperties:_initialProps launchOptions:@{}];
    } else {
        [NSException raise:@"UIApplicationDelegate:viewWithModuleName:initialProperties:launchOptions: not implemented"
                    format:@"Make sure you subclass RCTAppDelegate"];
    }
}

@end
