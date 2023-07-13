#import <UIKit/UIKit.h>

@interface RCTDrawerViewController : UIViewController

@property (nonatomic, copy) void (^boundsDidChangeBlock)(CGRect newBounds);

@end
