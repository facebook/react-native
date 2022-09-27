/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export interface OpenCameraDialogOptions {
  /** Defaults to false */
  videoMode?: boolean | undefined;
}

export interface OpenSelectDialogOptions {
  /** Defaults to true */
  showImages?: boolean | undefined;
  /** Defaults to false */
  showVideos?: boolean | undefined;
}

/** [imageURL|tempImageTag, height, width] */
export type ImagePickerResult = [string, number, number];

export interface ImagePickerIOSStatic {
  canRecordVideos(callback: (value: boolean) => void): void;
  canUseCamera(callback: (value: boolean) => void): void;
  openCameraDialog(
    config: OpenCameraDialogOptions,
    successCallback: (args: ImagePickerResult) => void,
    cancelCallback: (args: any[]) => void,
  ): void;
  openSelectDialog(
    config: OpenSelectDialogOptions,
    successCallback: (args: ImagePickerResult) => void,
    cancelCallback: (args: any[]) => void,
  ): void;
}

/**
 * ImagePickerIOS has been extracted from react-native core and will be removed in a future release.
 * Please upgrade to use either `@react-native-community/react-native-image-picker` or 'expo-image-picker'.
 * If you cannot upgrade to a different library, please install the deprecated `@react-native-community/image-picker-ios` package.
 * @see https://github.com/react-native-community/react-native-image-picker-ios
 * @deprecated
 */
export const ImagePickerIOS: ImagePickerIOSStatic;
export type ImagePickerIOS = ImagePickerIOSStatic;
