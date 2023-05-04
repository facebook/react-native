/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "FBSnapshotTestController.h"

#import <objc/runtime.h>

#import <UIKit/UIKit.h>

#import "UIImage+Compare.h"
#import "UIImage+Diff.h"

NSString *const FBSnapshotTestControllerErrorDomain = @"FBSnapshotTestControllerErrorDomain";

NSString *const FBReferenceImageFilePathKey = @"FBReferenceImageFilePathKey";

typedef struct RGBAPixel {
  char r;
  char g;
  char b;
  char a;
} RGBAPixel;

@interface FBSnapshotTestController ()

@property (readonly, nonatomic, copy) NSString *testName;

@end

@implementation FBSnapshotTestController {
  NSFileManager *_fileManager;
}

#pragma mark - Lifecycle

- (instancetype)initWithTestClass:(Class)testClass
{
  return [self initWithTestName:NSStringFromClass(testClass)];
}

- (instancetype)initWithTestName:(NSString *)testName
{
  if ((self = [super init])) {
    _testName = [testName copy];
    _fileManager = [NSFileManager new];
  }
  return self;
}

#pragma mark - Properties

- (NSString *)description
{
  return [NSString stringWithFormat:@"%@ %@", [super description], _referenceImagesDirectory];
}

#pragma mark - Public API

- (UIImage *)referenceImageForSelector:(SEL)selector identifier:(NSString *)identifier error:(NSError **)errorPtr
{
  NSString *filePath = [self _referenceFilePathForSelector:selector identifier:identifier];
  UIImage *image = [UIImage imageWithContentsOfFile:filePath];
  if (nil == image && NULL != errorPtr) {
    BOOL exists = [_fileManager fileExistsAtPath:filePath];
    if (!exists) {
      *errorPtr = [NSError errorWithDomain:FBSnapshotTestControllerErrorDomain
                                      code:FBSnapshotTestControllerErrorCodeNeedsRecord
                                  userInfo:@{
                                    FBReferenceImageFilePathKey : filePath,
                                    NSLocalizedDescriptionKey : @"Unable to load reference image.",
                                    NSLocalizedFailureReasonErrorKey :
                                        @"Reference image not found. You need to run the test in record mode",
                                  }];
    } else {
      *errorPtr = [NSError errorWithDomain:FBSnapshotTestControllerErrorDomain
                                      code:FBSnapshotTestControllerErrorCodeUnknown
                                  userInfo:nil];
    }
  }
  return image;
}

- (BOOL)saveReferenceImage:(UIImage *)image
                  selector:(SEL)selector
                identifier:(NSString *)identifier
                     error:(NSError **)errorPtr
{
  BOOL didWrite = NO;
  if (nil != image) {
    NSString *filePath = [self _referenceFilePathForSelector:selector identifier:identifier];
    NSData *pngData = UIImagePNGRepresentation(image);
    if (nil != pngData) {
      NSError *creationError = nil;
      BOOL didCreateDir = [_fileManager createDirectoryAtPath:[filePath stringByDeletingLastPathComponent]
                                  withIntermediateDirectories:YES
                                                   attributes:nil
                                                        error:&creationError];
      if (!didCreateDir) {
        if (NULL != errorPtr) {
          *errorPtr = creationError;
        }
        return NO;
      }
      didWrite = [pngData writeToFile:filePath options:NSDataWritingAtomic error:errorPtr];
      if (didWrite) {
        NSLog(@"Reference image save at: %@", filePath);
      }
    } else {
      if (nil != errorPtr) {
        *errorPtr = [NSError errorWithDomain:FBSnapshotTestControllerErrorDomain
                                        code:FBSnapshotTestControllerErrorCodePNGCreationFailed
                                    userInfo:@{
                                      FBReferenceImageFilePathKey : filePath,
                                    }];
      }
    }
  }
  return didWrite;
}

- (BOOL)saveFailedReferenceImage:(UIImage *)referenceImage
                       testImage:(UIImage *)testImage
                        selector:(SEL)selector
                      identifier:(NSString *)identifier
                           error:(NSError **)errorPtr
{
  NSData *referencePNGData = UIImagePNGRepresentation(referenceImage);
  NSData *testPNGData = UIImagePNGRepresentation(testImage);

  NSString *referencePath = [self _failedFilePathForSelector:selector
                                                  identifier:identifier
                                                fileNameType:FBTestSnapshotFileNameTypeFailedReference];

  NSError *creationError = nil;
  BOOL didCreateDir = [_fileManager createDirectoryAtPath:[referencePath stringByDeletingLastPathComponent]
                              withIntermediateDirectories:YES
                                               attributes:nil
                                                    error:&creationError];
  if (!didCreateDir) {
    if (NULL != errorPtr) {
      *errorPtr = creationError;
    }
    return NO;
  }

  if (![referencePNGData writeToFile:referencePath options:NSDataWritingAtomic error:errorPtr]) {
    return NO;
  }

  NSString *testPath = [self _failedFilePathForSelector:selector
                                             identifier:identifier
                                           fileNameType:FBTestSnapshotFileNameTypeFailedTest];

  if (![testPNGData writeToFile:testPath options:NSDataWritingAtomic error:errorPtr]) {
    return NO;
  }

  NSString *diffPath = [self _failedFilePathForSelector:selector
                                             identifier:identifier
                                           fileNameType:FBTestSnapshotFileNameTypeFailedTestDiff];

  UIImage *diffImage = [referenceImage diffWithImage:testImage];
  NSData *diffImageData = UIImagePNGRepresentation(diffImage);

  if (![diffImageData writeToFile:diffPath options:NSDataWritingAtomic error:errorPtr]) {
    return NO;
  }

  NSLog(
      @"If you have Kaleidoscope installed you can run this command to see an image diff:\n"
      @"ksdiff \"%@\" \"%@\"",
      referencePath,
      testPath);

  return YES;
}

- (BOOL)compareReferenceImage:(UIImage *)referenceImage toImage:(UIImage *)image error:(NSError **)errorPtr
{
  if (CGSizeEqualToSize(referenceImage.size, image.size)) {
    BOOL imagesEqual = [referenceImage compareWithImage:image];
    if (NULL != errorPtr) {
      *errorPtr = [NSError errorWithDomain:FBSnapshotTestControllerErrorDomain
                                      code:FBSnapshotTestControllerErrorCodeImagesDifferent
                                  userInfo:@{
                                    NSLocalizedDescriptionKey : @"Images different",
                                  }];
    }
    return imagesEqual;
  }
  if (NULL != errorPtr) {
    *errorPtr = [NSError
        errorWithDomain:FBSnapshotTestControllerErrorDomain
                   code:FBSnapshotTestControllerErrorCodeImagesDifferentSizes
               userInfo:@{
                 NSLocalizedDescriptionKey : @"Images different sizes",
                 NSLocalizedFailureReasonErrorKey : [NSString stringWithFormat:@"referenceImage:%@, image:%@",
                                                                               NSStringFromCGSize(referenceImage.size),
                                                                               NSStringFromCGSize(image.size)],
               }];
  }
  return NO;
}

#pragma mark - Private API

typedef NS_ENUM(NSInteger, FBTestSnapshotFileNameType) {
  FBTestSnapshotFileNameTypeReference,
  FBTestSnapshotFileNameTypeFailedReference,
  FBTestSnapshotFileNameTypeFailedTest,
  FBTestSnapshotFileNameTypeFailedTestDiff,
};

- (NSString *)_fileNameForSelector:(SEL)selector
                        identifier:(NSString *)identifier
                      fileNameType:(FBTestSnapshotFileNameType)fileNameType
{
  NSString *fileName = nil;
  switch (fileNameType) {
    case FBTestSnapshotFileNameTypeFailedReference:
      fileName = @"reference_";
      break;
    case FBTestSnapshotFileNameTypeFailedTest:
      fileName = @"failed_";
      break;
    case FBTestSnapshotFileNameTypeFailedTestDiff:
      fileName = @"diff_";
      break;
    default:
      fileName = @"";
      break;
  }
  fileName = [fileName stringByAppendingString:NSStringFromSelector(selector)];
  if (0 < identifier.length) {
    fileName = [fileName stringByAppendingFormat:@"_%@", identifier];
  }
  if ([[UIScreen mainScreen] scale] > 1.0) {
    fileName = [fileName stringByAppendingFormat:@"@%.fx", [[UIScreen mainScreen] scale]];
  }
  fileName = [fileName stringByAppendingPathExtension:@"png"];
  return fileName;
}

- (NSString *)_referenceFilePathForSelector:(SEL)selector identifier:(NSString *)identifier
{
  NSString *fileName = [self _fileNameForSelector:selector
                                       identifier:identifier
                                     fileNameType:FBTestSnapshotFileNameTypeReference];
  NSString *filePath = [_referenceImagesDirectory stringByAppendingPathComponent:_testName];
  filePath = [filePath stringByAppendingPathComponent:fileName];
  return filePath;
}

- (NSString *)_failedFilePathForSelector:(SEL)selector
                              identifier:(NSString *)identifier
                            fileNameType:(FBTestSnapshotFileNameType)fileNameType
{
  NSString *fileName = [self _fileNameForSelector:selector identifier:identifier fileNameType:fileNameType];
  NSString *folderPath = NSTemporaryDirectory();
  if (getenv("IMAGE_DIFF_DIR")) {
    folderPath = @(getenv("IMAGE_DIFF_DIR"));
  }
  NSString *filePath = [folderPath stringByAppendingPathComponent:_testName];
  filePath = [filePath stringByAppendingPathComponent:fileName];
  return filePath;
}

- (BOOL)compareSnapshotOfView:(id)view
                     selector:(SEL)selector
                   identifier:(NSString *)identifier
                        error:(NSError **)errorPtr
{
  if (self.recordMode) {
    return [self _recordSnapshotOfView:view selector:selector identifier:identifier error:errorPtr];
  } else {
    return [self _performPixelComparisonWithView:view selector:selector identifier:identifier error:errorPtr];
  }
}

#pragma mark - Private API

- (BOOL)_performPixelComparisonWithView:(UIView *)view
                               selector:(SEL)selector
                             identifier:(NSString *)identifier
                                  error:(NSError **)errorPtr
{
  UIImage *referenceImage = [self referenceImageForSelector:selector identifier:identifier error:errorPtr];
  if (nil != referenceImage) {
    UIImage *snapshot = [self _snapshotView:view];
    BOOL imagesSame = [self compareReferenceImage:referenceImage toImage:snapshot error:errorPtr];
    if (!imagesSame) {
      [self saveFailedReferenceImage:referenceImage
                           testImage:snapshot
                            selector:selector
                          identifier:identifier
                               error:errorPtr];
    }
    return imagesSame;
  }
  return NO;
}

- (BOOL)_recordSnapshotOfView:(UIView *)view
                     selector:(SEL)selector
                   identifier:(NSString *)identifier
                        error:(NSError **)errorPtr
{
  UIImage *snapshot = [self _snapshotView:view];
  return [self saveReferenceImage:snapshot selector:selector identifier:identifier error:errorPtr];
}

- (UIImage *)_snapshotView:(UIView *)view
{
  [view layoutIfNeeded];

  CGRect bounds = view.bounds;

  NSAssert1(CGRectGetWidth(bounds), @"Zero width for view %@", view);
  NSAssert1(CGRectGetHeight(bounds), @"Zero height for view %@", view);

  UIGraphicsImageRendererFormat *const rendererFormat = [UIGraphicsImageRendererFormat defaultFormat];
  UIGraphicsImageRenderer *const renderer = [[UIGraphicsImageRenderer alloc] initWithSize:bounds.size
                                                                                   format:rendererFormat];

  return [renderer imageWithActions:^(UIGraphicsImageRendererContext *_Nonnull context) {
    BOOL success = [view drawViewHierarchyInRect:bounds afterScreenUpdates:YES];
    NSAssert1(success, @"Could not create snapshot for view %@", view);
  }];
}

@end
