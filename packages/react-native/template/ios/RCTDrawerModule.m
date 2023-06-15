//
//  RCTDrawerModule.m
//  HelloWorld
//
//  Created by Grégoire Van der Auwermeulen on 15.06.23.
//

#import "RCTDrawerModule.h"
#import "AppDelegate.h"
#import <React/RCTUtils.h>


@implementation RCTDrawerModule

RCT_EXPORT_MODULE(TestModule);

RCT_EXPORT_METHOD(presentsWithGesture:(BOOL) present) {
  dispatch_async(dispatch_get_main_queue(), ^{
    UISplitViewController *presentedViewController = RCTPresentedViewController();
    [presentedViewController setPresentsWithGesture:present];
  });
}

RCT_EXPORT_METHOD(show)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    
    UISplitViewController *presentedViewController = RCTPresentedViewController();
    [presentedViewController showColumn:UISplitViewControllerColumnPrimary];
  });
}

@end
