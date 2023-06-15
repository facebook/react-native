//
//  RCTDrawerViewController.h
//  HelloWorld
//
//  Created by Grégoire Van der Auwermeulen on 15.06.23.
//

#import <UIKit/UIKit.h>

@interface RCTDrawerViewController : UIViewController

@property (nonatomic, copy) void (^boundsDidChangeBlock)(CGRect newBounds);

@end
