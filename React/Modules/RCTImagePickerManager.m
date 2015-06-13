//
//  RCTImagePickerManager.m
//  React
//
//  Created by David Mohl on 6/13/15.
//  Copyright © 2015 Facebook. All rights reserved.
//

#import "RCTImagePickerManager.h"
#import "RCTRootView.h"

@implementation RCTImagePickerManager
{
  NSMutableArray *_pickers;
  NSMutableArray *_pickerCallbacks;
  NSMutableArray *_pickerCancelCallbacks;
}

RCT_EXPORT_MODULE(ImagePicker);

- (instancetype)init {
  if ((self = [super init])) {
    _pickers = [[NSMutableArray alloc] init];
    _pickerCallbacks = [[NSMutableArray alloc] init];
    _pickerCancelCallbacks = [[NSMutableArray alloc] init];
  }
  return self;
}

- (void)viewDidLoad {
  [super viewDidLoad];
}

RCT_EXPORT_METHOD(selectPhoto:(RCTResponseSenderBlock)callback onCancel:(RCTResponseSenderBlock)errorCallback)
{
  NSLog(@"Doing something cool now");

  UIWindow *keyWindow = [[UIApplication sharedApplication] keyWindow];
  UIViewController *rootViewController = keyWindow.rootViewController;

  UIImagePickerController *imagePicker = [[UIImagePickerController alloc] init];
  imagePicker.delegate = self;

  [_pickers addObject:imagePicker];
  [_pickerCallbacks addObject:callback];
  [_pickerCancelCallbacks addObject:errorCallback];

  [rootViewController presentViewController:imagePicker animated:YES completion:nil];
}

-(void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary *)info
{
  NSUInteger index = [_pickers indexOfObject:picker];
  RCTResponseSenderBlock callback = _pickerCallbacks[index];

  NSLog(@"%@", info);

  [_pickers removeObjectAtIndex:index];
  [_pickerCallbacks removeObjectAtIndex:index];
  [_pickerCancelCallbacks removeObjectAtIndex:index];

  UIWindow *keyWindow = [[UIApplication sharedApplication] keyWindow];
  UIViewController *rootViewController = keyWindow.rootViewController;
  [rootViewController dismissViewControllerAnimated:YES completion:nil];

  callback(@[
             [info[UIImagePickerControllerReferenceURL] absoluteString]
             ]);
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker
{

  NSUInteger index = [_pickers indexOfObject:picker];
  RCTResponseSenderBlock callback = _pickerCancelCallbacks[index];

  [_pickers removeObjectAtIndex:index];
  [_pickerCallbacks removeObjectAtIndex:index];
  [_pickerCancelCallbacks removeObjectAtIndex:index];

  UIWindow *keyWindow = [[UIApplication sharedApplication] keyWindow];
  UIViewController *rootViewController = keyWindow.rootViewController;
  [rootViewController dismissViewControllerAnimated:YES completion:nil];

  callback(@[]);
}

@end
