#import <UIKit/UIKit.h>

/**
  A `UIViewController` responsible for embeding `RCTRootView` inside. Uses Factory pattern to retrive new view instances.
 
  Note: Used to in `RCTRootViewRepresentable` to display React views.
 */
@interface RCTReactViewController : UIViewController

@property (nonatomic, strong, nonnull) NSString *moduleName;
@property (nonatomic, strong, nullable) NSDictionary *initialProps;

- (instancetype _Nonnull)initWithModuleName:(NSString *_Nonnull)moduleName
                                   initProps:(NSDictionary *_Nullable)initProps;

@end
