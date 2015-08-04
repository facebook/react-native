/*
 *  Copyright (c) 2013, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import "RCTImagePickerManager.h"
#import "RCTRootView.h"

#import <UIKit/UIKit.h>

#import <MobileCoreServices/UTCoreTypes.h>

@interface RCTImagePickerManager ()<UIImagePickerControllerDelegate, UINavigationControllerDelegate>

@end

@implementation RCTImagePickerManager
{
  NSMutableArray *_pickers;
  NSMutableArray *_pickerCallbacks;
  NSMutableArray *_pickerCancelCallbacks;
}

RCT_EXPORT_MODULE(ImagePickerIOS);

- (instancetype)init
{
  if ((self = [super init])) {
    _pickers = [[NSMutableArray alloc] init];
    _pickerCallbacks = [[NSMutableArray alloc] init];
    _pickerCancelCallbacks = [[NSMutableArray alloc] init];
  }
  return self;
}

RCT_EXPORT_METHOD(canRecordVideos:(RCTResponseSenderBlock)callback)
{
  NSArray *availableMediaTypes = [UIImagePickerController availableMediaTypesForSourceType:UIImagePickerControllerSourceTypeCamera];
  callback(@[@([availableMediaTypes containsObject:(NSString *)kUTTypeMovie])]);
}

RCT_EXPORT_METHOD(canUseCamera:(RCTResponseSenderBlock)callback)
{
  callback(@[@([UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeCamera])]);
}

RCT_EXPORT_METHOD(openCameraDialog:(NSDictionary *)config
                  successCallback:(RCTResponseSenderBlock)callback
                  cancelCallback:(RCTResponseSenderBlock)cancelCallback)
{
  UIWindow *keyWindow = [[UIApplication sharedApplication] keyWindow];
  UIViewController *rootViewController = keyWindow.rootViewController;

  UIImagePickerController *imagePicker = [[UIImagePickerController alloc] init];
  imagePicker.delegate = self;
  imagePicker.sourceType = UIImagePickerControllerSourceTypeCamera;

  if ([config[@"videoMode"] boolValue]) {
    imagePicker.cameraCaptureMode = UIImagePickerControllerCameraCaptureModeVideo;
  }

  [_pickers addObject:imagePicker];
  [_pickerCallbacks addObject:callback];
  [_pickerCancelCallbacks addObject:cancelCallback];

  [rootViewController presentViewController:imagePicker animated:YES completion:nil];
}

RCT_EXPORT_METHOD(openSelectDialog:(NSDictionary *)config
                  successCallback:(RCTResponseSenderBlock)callback
                  cancelCallback:(RCTResponseSenderBlock)cancelCallback)
{
  UIWindow *keyWindow = [[UIApplication sharedApplication] keyWindow];
  UIViewController *rootViewController = keyWindow.rootViewController;

  UIImagePickerController *imagePicker = [[UIImagePickerController alloc] init];
  imagePicker.delegate = self;
  imagePicker.sourceType = UIImagePickerControllerSourceTypePhotoLibrary;

  NSMutableArray *allowedTypes = [[NSMutableArray alloc] init];
  if ([config[@"showImages"] boolValue]) {
    [allowedTypes addObject:(NSString *)kUTTypeImage];
  }
  if ([config[@"showVideos"] boolValue]) {
    [allowedTypes addObject:(NSString *)kUTTypeMovie];
  }

  imagePicker.mediaTypes = allowedTypes;

  [_pickers addObject:imagePicker];
  [_pickerCallbacks addObject:callback];
  [_pickerCancelCallbacks addObject:cancelCallback];

  [rootViewController presentViewController:imagePicker animated:YES completion:nil];
}

- (void)imagePickerController:(UIImagePickerController *)picker
didFinishPickingMediaWithInfo:(NSDictionary *)info
{
  NSUInteger index = [_pickers indexOfObject:picker];
  RCTResponseSenderBlock callback = _pickerCallbacks[index];

  [_pickers removeObjectAtIndex:index];
  [_pickerCallbacks removeObjectAtIndex:index];
  [_pickerCancelCallbacks removeObjectAtIndex:index];

  UIWindow *keyWindow = [[UIApplication sharedApplication] keyWindow];
  UIViewController *rootViewController = keyWindow.rootViewController;
  [rootViewController dismissViewControllerAnimated:YES completion:nil];

  callback(@[[info[UIImagePickerControllerReferenceURL] absoluteString]]);
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
