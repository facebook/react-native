//  Created by Arkadiusz on 01-04-14.

#import <UIKit/UIKit.h>

/// A UINavigationController subclass allowing the interactive pop gesture to be recognized when the navigation bar is hidden or a custom back button is used.
@interface AHKNavigationController : UINavigationController

- (void)pushViewController:(UIViewController *)viewController
                  animated:(BOOL)animated __attribute__((objc_requires_super));

@end
