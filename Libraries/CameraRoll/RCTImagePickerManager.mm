/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImagePickerManager.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <MobileCoreServices/UTCoreTypes.h>
#import <UIKit/UIKit.h>

#import <React/RCTConvert.h>
#import <React/RCTImageStoreManager.h>
#import <React/RCTRootView.h>
#import <React/RCTUtils.h>

#import "RCTCameraRollPlugins.h"

@interface RCTImagePickerController : UIImagePickerController

@property (nonatomic, assign) BOOL unmirrorFrontFacingCamera;

@end

@implementation RCTImagePickerController

@end

@interface RCTImagePickerManager () <UIImagePickerControllerDelegate, UINavigationControllerDelegate, NativeImagePickerIOSSpec>
@end

@implementation RCTImagePickerManager
{
  NSMutableArray<UIImagePickerController *> *_pickers;
  NSMutableArray<RCTResponseSenderBlock> *_pickerCallbacks;
  NSMutableArray<RCTResponseSenderBlock> *_pickerCancelCallbacks;
  NSMutableDictionary<NSString *, NSDictionary<NSString *, id> *> *_pendingVideoInfo;
}

RCT_EXPORT_MODULE(ImagePickerIOS);

@synthesize bridge = _bridge;

- (id)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(cameraChanged:)
                                                 name:@"AVCaptureDeviceDidStartRunningNotification"
                                               object:nil];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(canRecordVideos:(RCTResponseSenderBlock)callback)
{
  NSArray<NSString *> *availableMediaTypes = [UIImagePickerController availableMediaTypesForSourceType:UIImagePickerControllerSourceTypeCamera];
  callback(@[@([availableMediaTypes containsObject:(NSString *)kUTTypeMovie])]);
}

RCT_EXPORT_METHOD(canUseCamera:(RCTResponseSenderBlock)callback)
{
  callback(@[@([UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeCamera])]);
}

RCT_EXPORT_METHOD(openCameraDialog:(JS::NativeImagePickerIOS::SpecOpenCameraDialogConfig &)config
                  successCallback:(RCTResponseSenderBlock)callback
                  cancelCallback:(RCTResponseSenderBlock)cancelCallback)
{
  if (RCTRunningInAppExtension()) {
    cancelCallback(@[@"Camera access is unavailable in an app extension"]);
    return;
  }

  RCTImagePickerController *imagePicker = [RCTImagePickerController new];
  imagePicker.delegate = self;
  imagePicker.sourceType = UIImagePickerControllerSourceTypeCamera;
  NSArray<NSString *> *availableMediaTypes = [UIImagePickerController availableMediaTypesForSourceType:UIImagePickerControllerSourceTypeCamera];
  imagePicker.mediaTypes = availableMediaTypes;
  imagePicker.unmirrorFrontFacingCamera = config.unmirrorFrontFacingCamera() ? YES : NO;

  if (config.videoMode()) {
    imagePicker.cameraCaptureMode = UIImagePickerControllerCameraCaptureModeVideo;
  }

  [self _presentPicker:imagePicker
       successCallback:callback
        cancelCallback:cancelCallback];
}

RCT_EXPORT_METHOD(openSelectDialog:(JS::NativeImagePickerIOS::SpecOpenSelectDialogConfig &)config
                  successCallback:(RCTResponseSenderBlock)callback
                  cancelCallback:(RCTResponseSenderBlock)cancelCallback)
{
  if (RCTRunningInAppExtension()) {
    cancelCallback(@[@"Image picker is currently unavailable in an app extension"]);
    return;
  }

  UIImagePickerController *imagePicker = [UIImagePickerController new];
  imagePicker.delegate = self;
  imagePicker.sourceType = UIImagePickerControllerSourceTypePhotoLibrary;

  NSMutableArray<NSString *> *allowedTypes = [NSMutableArray new];
  if (config.showImages()) {
    [allowedTypes addObject:(NSString *)kUTTypeImage];
  }
  if (config.showVideos()) {
    [allowedTypes addObject:(NSString *)kUTTypeMovie];
  }

  imagePicker.mediaTypes = allowedTypes;

  [self _presentPicker:imagePicker
       successCallback:callback
        cancelCallback:cancelCallback];
}

// In iOS 13, the URLs provided when selecting videos from the library are only valid while the
// info object provided by the delegate is retained.
// This method provides a way to clear out all retained pending info objects.
RCT_EXPORT_METHOD(clearAllPendingVideos)
{
  [_pendingVideoInfo removeAllObjects];
  _pendingVideoInfo = [NSMutableDictionary new];
}

// In iOS 13, the URLs provided when selecting videos from the library are only valid while the
// info object provided by the delegate is retained.
// This method provides a way to release the info object for a particular file url when the application
// is done with it, for example after the video has been uploaded or copied locally.
RCT_EXPORT_METHOD(removePendingVideo:(NSString *)url)
{
  [_pendingVideoInfo removeObjectForKey:url];
}

- (void)imagePickerController:(UIImagePickerController *)picker
didFinishPickingMediaWithInfo:(NSDictionary<NSString *, id> *)info
{
  NSString *mediaType = info[UIImagePickerControllerMediaType];
  BOOL isMovie = [mediaType isEqualToString:(NSString *)kUTTypeMovie];
  NSString *key = isMovie ? UIImagePickerControllerMediaURL : UIImagePickerControllerReferenceURL;
  NSURL *imageURL = info[key];
  UIImage *image = info[UIImagePickerControllerOriginalImage];
  NSNumber *width = 0;
  NSNumber *height = 0;
  if (image) {
    height = @(image.size.height);
    width = @(image.size.width);
  }
  if (imageURL) {
    NSString *imageURLString = imageURL.absoluteString;
    // In iOS 13, video URLs are only valid while info dictionary is retained
    if (@available(iOS 13.0, *)) {
      if (isMovie) {
        _pendingVideoInfo[imageURLString] = info;
      }
    }

    [self _dismissPicker:picker args:@[imageURLString, RCTNullIfNil(height), RCTNullIfNil(width)]];
    return;
  }

  // This is a newly taken image, and doesn't have a URL yet.
  // We need to save it to the image store first.
  UIImage *originalImage = info[UIImagePickerControllerOriginalImage];

  // WARNING: Using ImageStoreManager may cause a memory leak because the
  // image isn't automatically removed from store once we're done using it.
  [_bridge.imageStoreManager storeImage:originalImage withBlock:^(NSString *tempImageTag) {
    [self _dismissPicker:picker args:tempImageTag ? @[tempImageTag, RCTNullIfNil(height), RCTNullIfNil(width)] : nil];
  }];
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker
{
  [self _dismissPicker:picker args:nil];
}

- (void)_presentPicker:(UIImagePickerController *)imagePicker
       successCallback:(RCTResponseSenderBlock)callback
        cancelCallback:(RCTResponseSenderBlock)cancelCallback
{
  if (!_pickers) {
    _pickers = [NSMutableArray new];
    _pickerCallbacks = [NSMutableArray new];
    _pickerCancelCallbacks = [NSMutableArray new];
    _pendingVideoInfo = [NSMutableDictionary new];
  }

  [_pickers addObject:imagePicker];
  [_pickerCallbacks addObject:callback];
  [_pickerCancelCallbacks addObject:cancelCallback];

  UIViewController *rootViewController = RCTPresentedViewController();
  [rootViewController presentViewController:imagePicker animated:YES completion:nil];
}

- (void)_dismissPicker:(UIImagePickerController *)picker args:(NSArray *)args
{
  NSUInteger index = [_pickers indexOfObject:picker];
  if (index == NSNotFound) {
    // This happens if the user selects multiple items in succession.
    return;
  }

  RCTResponseSenderBlock successCallback = _pickerCallbacks[index];
  RCTResponseSenderBlock cancelCallback = _pickerCancelCallbacks[index];

  [_pickers removeObjectAtIndex:index];
  [_pickerCallbacks removeObjectAtIndex:index];
  [_pickerCancelCallbacks removeObjectAtIndex:index];

  UIViewController *rootViewController = RCTPresentedViewController();
  [rootViewController dismissViewControllerAnimated:YES completion:nil];

  if (args) {
    successCallback(args);
  } else {
    cancelCallback(@[]);
  }
}

- (void)cameraChanged:(NSNotification *)notification
{
  for (UIImagePickerController *picker in _pickers) {
    if ([picker isKindOfClass:[RCTImagePickerController class]]
      && ((RCTImagePickerController *)picker).unmirrorFrontFacingCamera
      && picker.cameraDevice == UIImagePickerControllerCameraDeviceFront) {
      picker.cameraViewTransform = CGAffineTransformScale(CGAffineTransformIdentity, -1, 1);
    } else {
      picker.cameraViewTransform = CGAffineTransformIdentity;
    }
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  return std::make_shared<facebook::react::NativeImagePickerIOSSpecJSI>(self, jsInvoker);
}

@end

Class RCTImagePickerManagerCls(void) {
  return RCTImagePickerManager.class;
}
