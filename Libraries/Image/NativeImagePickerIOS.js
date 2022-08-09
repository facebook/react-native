/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {||};
  +canRecordVideos: (callback: (result: boolean) => void) => void;
  +canUseCamera: (callback: (result: boolean) => void) => void;
  +openCameraDialog: (
    config: {|
      unmirrorFrontFacingCamera: boolean,
      videoMode: boolean,
    |},
    successCallback: (imageURL: string, height: number, width: number) => void,
    cancelCallback: () => void,
  ) => void;
  +openSelectDialog: (
    config: {|
      showImages: boolean,
      showVideos: boolean,
    |},
    successCallback: (imageURL: string, height: number, width: number) => void,
    cancelCallback: () => void,
  ) => void;
  +clearAllPendingVideos: () => void;
  +removePendingVideo: (url: string) => void;
}

export default (TurboModuleRegistry.get<Spec>('ImagePickerIOS'): ?Spec);
