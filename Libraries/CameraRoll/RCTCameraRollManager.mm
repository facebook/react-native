/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTCameraRollManager.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <Photos/Photos.h>
#import <dlfcn.h>
#import <objc/runtime.h>
#import <MobileCoreServices/UTType.h>

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTImageLoader.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

#import "RCTCameraRollPlugins.h"
#import "RCTAssetsLibraryRequestHandler.h"

@implementation RCTConvert (PHAssetCollectionSubtype)

RCT_ENUM_CONVERTER(PHAssetCollectionSubtype, (@{
   @"album": @(PHAssetCollectionSubtypeAny),
   @"all": @(PHAssetCollectionSubtypeSmartAlbumUserLibrary),
   @"event": @(PHAssetCollectionSubtypeAlbumSyncedEvent),
   @"faces": @(PHAssetCollectionSubtypeAlbumSyncedFaces),
   @"library": @(PHAssetCollectionSubtypeSmartAlbumUserLibrary),
   @"photo-stream": @(PHAssetCollectionSubtypeAlbumMyPhotoStream), // incorrect, but legacy
   @"photostream": @(PHAssetCollectionSubtypeAlbumMyPhotoStream),
   @"saved-photos": @(PHAssetCollectionSubtypeAny), // incorrect, but legacy
   @"savedphotos": @(PHAssetCollectionSubtypeAny), // This was ALAssetsGroupSavedPhotos, seems to have no direct correspondence in PHAssetCollectionSubtype
}), PHAssetCollectionSubtypeAny, integerValue)


@end

@implementation RCTConvert (PHFetchOptions)

+ (PHFetchOptions *)PHFetchOptionsFromMediaType:(NSString *)mediaType
{
  // This is not exhaustive in terms of supported media type predicates; more can be added in the future
  NSString *const lowercase = [mediaType lowercaseString];

  if ([lowercase isEqualToString:@"photos"]) {
    PHFetchOptions *const options = [PHFetchOptions new];
    options.predicate = [NSPredicate predicateWithFormat:@"mediaType = %d", PHAssetMediaTypeImage];
    return options;
  } else if ([lowercase isEqualToString:@"videos"]) {
    PHFetchOptions *const options = [PHFetchOptions new];
    options.predicate = [NSPredicate predicateWithFormat:@"mediaType = %d", PHAssetMediaTypeVideo];
    return options;
  } else {
    if (![lowercase isEqualToString:@"all"]) {
      RCTLogError(@"Invalid filter option: '%@'. Expected one of 'photos',"
                  "'videos' or 'all'.", mediaType);
    }
    // This case includes the "all" mediatype
    return nil;
  }
}

@end

@interface RCTCameraRollManager() <NativeCameraRollManagerSpec>
@end

@implementation RCTCameraRollManager

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

static NSString *const kErrorUnableToSave = @"E_UNABLE_TO_SAVE";
static NSString *const kErrorUnableToLoad = @"E_UNABLE_TO_LOAD";

static NSString *const kErrorAuthRestricted = @"E_PHOTO_LIBRARY_AUTH_RESTRICTED";
static NSString *const kErrorAuthDenied = @"E_PHOTO_LIBRARY_AUTH_DENIED";

typedef void (^PhotosAuthorizedBlock)(void);

static void requestPhotoLibraryAccess(RCTPromiseRejectBlock reject, PhotosAuthorizedBlock authorizedBlock) {
  PHAuthorizationStatus authStatus = [PHPhotoLibrary authorizationStatus];
  if (authStatus == PHAuthorizationStatusRestricted) {
    reject(kErrorAuthRestricted, @"Access to photo library is restricted", nil);
  } else if (authStatus == PHAuthorizationStatusAuthorized) {
    authorizedBlock();
  } else if (authStatus == PHAuthorizationStatusNotDetermined) {
    [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
      requestPhotoLibraryAccess(reject, authorizedBlock);
    }];
  } else {
    reject(kErrorAuthDenied, @"Access to photo library was denied", nil);
  }
}

RCT_EXPORT_METHOD(saveToCameraRoll:(NSURLRequest *)request
                  type:(NSString *)type
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  __block PHObjectPlaceholder *placeholder;

  // We load images and videos differently.
  // Images have many custom loaders which can load images from ALAssetsLibrary URLs, PHPhotoLibrary
  // URLs, `data:` URIs, etc. Video URLs are passed directly through for now; it may be nice to support
  // more ways of loading videos in the future.
  __block NSURL *inputURI = nil;
  __block UIImage *inputImage = nil;

  void (^saveBlock)(void) = ^void() {
    // performChanges and the completionHandler are called on
    // arbitrary threads, not the main thread - this is safe
    // for now since all JS is queued and executed on a single thread.
    // We should reevaluate this if that assumption changes.
    [[PHPhotoLibrary sharedPhotoLibrary] performChanges:^{
      PHAssetChangeRequest *changeRequest;

      // Defaults to "photo". `type` is an optional param.
      if ([type isEqualToString:@"video"]) {
        changeRequest = [PHAssetChangeRequest creationRequestForAssetFromVideoAtFileURL:inputURI];
      } else {
        changeRequest = [PHAssetChangeRequest creationRequestForAssetFromImage:inputImage];
      }

      placeholder = [changeRequest placeholderForCreatedAsset];
    } completionHandler:^(BOOL success, NSError * _Nullable error) {
      if (success) {
        NSString *uri = [NSString stringWithFormat:@"ph://%@", [placeholder localIdentifier]];
        resolve(uri);
      } else {
        reject(kErrorUnableToSave, nil, error);
      }
    }];
  };

  void (^loadBlock)(void) = ^void() {
    if ([type isEqualToString:@"video"]) {
      inputURI = request.URL;
      saveBlock();
    } else {
      [[self.bridge moduleForClass:[RCTImageLoader class]] loadImageWithURLRequest:request callback:^(NSError *error, UIImage *image) {
        if (error) {
          reject(kErrorUnableToLoad, nil, error);
          return;
        }

        inputImage = image;
        saveBlock();
      }];
    }
  };

  requestPhotoLibraryAccess(reject, loadBlock);
}

static void RCTResolvePromise(RCTPromiseResolveBlock resolve,
                              NSArray<NSDictionary<NSString *, id> *> *assets,
                              BOOL hasNextPage)
{
  if (!assets.count) {
    resolve(@{
      @"edges": assets,
      @"page_info": @{
        @"has_next_page": @NO,
      }
    });
    return;
  }
  resolve(@{
    @"edges": assets,
    @"page_info": @{
      @"start_cursor": assets[0][@"node"][@"image"][@"uri"],
      @"end_cursor": assets[assets.count - 1][@"node"][@"image"][@"uri"],
      @"has_next_page": @(hasNextPage),
    }
  });
}

RCT_EXPORT_METHOD(getPhotos:(JS::NativeCameraRollManager::GetPhotosParams &)params
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  checkPhotoLibraryConfig();

  NSUInteger const first = [RCTConvert NSInteger:[NSNumber numberWithDouble:params.first()]];
  NSString *const afterCursor = [RCTConvert NSString:params.after()];
  NSString *const groupName = [RCTConvert NSString:params.groupName()];
  NSString *const groupTypes = [[RCTConvert NSString:params.groupTypes()] lowercaseString];
  NSString *const mediaType = [RCTConvert NSString:params.assetType()];
  NSArray<NSString *> *const mimeTypes = [RCTConvert NSStringArray:RCTConvertOptionalVecToArray(params.mimeTypes())];

  // If groupTypes is "all", we want to fetch the SmartAlbum "all photos". Otherwise, all
  // other groupTypes values require the "album" collection type.
  PHAssetCollectionType const collectionType = ([groupTypes isEqualToString:@"all"]
                                                ? PHAssetCollectionTypeSmartAlbum
                                                : PHAssetCollectionTypeAlbum);
  PHAssetCollectionSubtype const collectionSubtype = [RCTConvert PHAssetCollectionSubtype:groupTypes];

  // Predicate for fetching assets within a collection
  PHFetchOptions *const assetFetchOptions = [RCTConvert PHFetchOptionsFromMediaType:mediaType];
  assetFetchOptions.sortDescriptors = @[[NSSortDescriptor sortDescriptorWithKey:@"creationDate" ascending:NO]];

  BOOL __block foundAfter = NO;
  BOOL __block hasNextPage = NO;
  BOOL __block resolvedPromise = NO;
  NSMutableArray<NSDictionary<NSString *, id> *> *assets = [NSMutableArray new];

  // Filter collection name ("group")
  PHFetchOptions *const collectionFetchOptions = [PHFetchOptions new];
  collectionFetchOptions.sortDescriptors = @[[NSSortDescriptor sortDescriptorWithKey:@"endDate" ascending:NO]];
  if (groupName != nil) {
    collectionFetchOptions.predicate = [NSPredicate predicateWithFormat:[NSString stringWithFormat:@"localizedTitle == '%@'", groupName]];
  }

  requestPhotoLibraryAccess(reject, ^{
    PHFetchResult<PHAssetCollection *> *const assetCollectionFetchResult = [PHAssetCollection fetchAssetCollectionsWithType:collectionType subtype:collectionSubtype options:collectionFetchOptions];
    [assetCollectionFetchResult enumerateObjectsUsingBlock:^(PHAssetCollection * _Nonnull assetCollection, NSUInteger collectionIdx, BOOL * _Nonnull stopCollections) {
      // Enumerate assets within the collection
      PHFetchResult<PHAsset *> *const assetsFetchResult = [PHAsset fetchAssetsInAssetCollection:assetCollection options:assetFetchOptions];

      [assetsFetchResult enumerateObjectsUsingBlock:^(PHAsset * _Nonnull asset, NSUInteger assetIdx, BOOL * _Nonnull stopAssets) {
        NSString *const uri = [NSString stringWithFormat:@"ph://%@", [asset localIdentifier]];
        if (afterCursor && !foundAfter) {
          if ([afterCursor isEqualToString:uri]) {
            foundAfter = YES;
          }
          return; // skip until we get to the first one
        }

        // Get underlying resources of an asset - this includes files as well as details about edited PHAssets
        if ([mimeTypes count] > 0) {
          NSArray<PHAssetResource *> *const assetResources = [PHAssetResource assetResourcesForAsset:asset];
          if (![assetResources firstObject]) {
            return;
          }

          PHAssetResource *const _Nonnull resource = [assetResources firstObject];
          CFStringRef const uti = (__bridge CFStringRef _Nonnull)(resource.uniformTypeIdentifier);
          NSString *const mimeType = (NSString *)CFBridgingRelease(UTTypeCopyPreferredTagWithClass(uti, kUTTagClassMIMEType));

          BOOL __block mimeTypeFound = NO;
          [mimeTypes enumerateObjectsUsingBlock:^(NSString * _Nonnull mimeTypeFilter, NSUInteger idx, BOOL * _Nonnull stop) {
            if ([mimeType isEqualToString:mimeTypeFilter]) {
              mimeTypeFound = YES;
              *stop = YES;
            }
          }];

          if (!mimeTypeFound) {
            return;
          }
        }

        // If we've accumulated enough results to resolve a single promise
        if (first == assets.count) {
          *stopAssets = YES;
          *stopCollections = YES;
          hasNextPage = YES;
          RCTAssert(resolvedPromise == NO, @"Resolved the promise before we finished processing the results.");
          RCTResolvePromise(resolve, assets, hasNextPage);
          resolvedPromise = YES;
          return;
        }

        NSString *const assetMediaTypeLabel = (asset.mediaType == PHAssetMediaTypeVideo
                                               ? @"video"
                                               : (asset.mediaType == PHAssetMediaTypeImage
                                                  ? @"image"
                                                  : (asset.mediaType == PHAssetMediaTypeAudio
                                                     ? @"audio"
                                                     : @"unknown")));
        CLLocation *const loc = asset.location;

        // A note on isStored: in the previous code that used ALAssets, isStored
        // was always set to YES, probably because iCloud-synced images were never returned (?).
        // To get the "isStored" information and filename, we would need to actually request the
        // image data from the image manager. Those operations could get really expensive and
        // would definitely utilize the disk too much.
        // Thus, this field is actually not reliable.
        // Note that Android also does not return the `isStored` field at all.
        [assets addObject:@{
           @"node": @{
             @"type": assetMediaTypeLabel, // TODO: switch to mimeType?
             @"group_name": [assetCollection localizedTitle],
             @"image": @{
                 @"uri": uri,
                 @"height": @([asset pixelHeight]),
                 @"width": @([asset pixelWidth]),
                 @"isStored": @YES, // this field doesn't seem to exist on android
                 @"playableDuration": @([asset duration]) // fractional seconds
             },
             @"timestamp": @(asset.creationDate.timeIntervalSince1970),
             @"location": (loc ? @{
                 @"latitude": @(loc.coordinate.latitude),
                 @"longitude": @(loc.coordinate.longitude),
                 @"altitude": @(loc.altitude),
                 @"heading": @(loc.course),
                 @"speed": @(loc.speed), // speed in m/s
               } : @{})
             }
        }];
      }];
    }];

    // If we get this far and haven't resolved the promise yet, we reached the end of the list of photos
    if (!resolvedPromise) {
      hasNextPage = NO;
      RCTResolvePromise(resolve, assets, hasNextPage);
      resolvedPromise = YES;
    }
  });
}

RCT_EXPORT_METHOD(deletePhotos:(NSArray<NSString *>*)assets
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  NSArray<NSURL *> *assets_ = [RCTConvert NSURLArray:assets];
  [[PHPhotoLibrary sharedPhotoLibrary] performChanges:^{
      PHFetchResult<PHAsset *> *fetched =
        [PHAsset fetchAssetsWithALAssetURLs:assets_ options:nil];
      [PHAssetChangeRequest deleteAssets:fetched];
    }
  completionHandler:^(BOOL success, NSError *error) {
      if (success == YES) {
     	    resolve(@(success));
      }
      else {
	        reject(@"Couldn't delete", @"Couldn't delete assets", error);
      }
    }
    ];
}

static void checkPhotoLibraryConfig()
{
#if RCT_DEV
  if (![[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSPhotoLibraryUsageDescription"]) {
    RCTLogError(@"NSPhotoLibraryUsageDescription key must be present in Info.plist to use camera roll.");
  }
#endif
}

- (std::shared_ptr<facebook::react::TurboModule>)
    getTurboModuleWithJsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
                  nativeInvoker:(std::shared_ptr<facebook::react::CallInvoker>)nativeInvoker
                     perfLogger:(id<RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<facebook::react::NativeCameraRollManagerSpecJSI>(self, jsInvoker, nativeInvoker, perfLogger);
}

@end

Class RCTCameraRollManagerCls(void) {
  return RCTCameraRollManager.class;
}
