/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +startReportAProblemFlow: () => void;
  +setExtraData: (extraData: Object, extraFiles: Object) => void;
  +setCategoryID: (categoryID: string) => void;
}

export default (TurboModuleRegistry.get<Spec>('BugReporting'): ?Spec);
