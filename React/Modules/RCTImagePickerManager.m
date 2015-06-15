//
//  RCTImagePickerManager.m
//  React
//
//  Created by David Mohl on 6/13/15.
//  Copyright © 2015 Facebook. All rights reserved.
//

#import "RCTImagePickerManager.h"
#import "RCTRootView.h"
#import <MobileCoreServices/UTCoreTypes.h>

@implementation RCTImagePickerManager
{
  NSMutableArray *_pickers;
  NSMutableArray *_pickerCallbacks;
  NSMutableArray *_pickerCancelCallbacks;
}

RCT_EXPORT_MODULE(ImagePickerIOS);

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

RCT_EXPORT_METHOD(canRecordVideos:(RCTResponseSenderBlock)callback)
{
  NSArray *availableMediaTypes = [UIImagePickerController availableMediaTypesForSourceType:UIImagePickerControllerSourceTypeCamera];
  callback(@[
      [NSNumber numberWithBool:[availableMediaTypes containsObject:(NSString *)kUTTypeMovie]]
      ]);
}

RCT_EXPORT_METHOD(canUseCamera:(RCTResponseSenderBlock)callback)
{
  callback(@[
      [NSNumber numberWithBool:[UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeCamera]]
      ]);
}

RCT_EXPORT_METHOD(openCameraDialog:(NSDictionary *)config andSuccessCallback:(RCTResponseSenderBlock)callback andCancelCallback:(RCTResponseSenderBlock)cancelCallback)
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

RCT_EXPORT_METHOD(openSelectDialog:(NSDictionary *)config andSuccessCallback:(RCTResponseSenderBlock)callback andCancelCallback:(RCTResponseSenderBlock)cancelCallback)
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

-(void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary *)info
{
  NSUInteger index = [_pickers indexOfObject:picker];
  RCTResponseSenderBlock callback = _pickerCallbacks[index];

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
