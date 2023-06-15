#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>

#define IS_IPAD (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad)

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"HelloWorld";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (void)setRootView:(UIView *)rootView toRootViewController:(UIViewController *)rootViewController {
  if (!IS_IPAD) {
    rootViewController.view = rootView;
  } else {
    UIViewController *mainVC = [[UIViewController alloc] init];
    mainVC.view = rootView;
    
    // Cast UIViewController to UISplitViewController
    UISplitViewController *splitViewController = (UISplitViewController *)rootViewController;
    
    [splitViewController setViewController:mainVC forColumn:UISplitViewControllerColumnSecondary];
  }
}

- (UIViewController *)createRootViewController {
  if(!IS_IPAD) {
    return [[UIViewController alloc] init];
  }
  
  UISplitViewController *splitViewController = [[UISplitViewController alloc] initWithStyle:UISplitViewControllerStyleDoubleColumn];
  
  // Don't enable drawer by default
  // Removes button to toggle drawer and disables gesture to open
  // DrawerLayoutIos is responsible for enabling the drawer / screen
  //[splitViewController setPresentsWithGesture:false];

  return splitViewController;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
