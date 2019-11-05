/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import {TurboModuleRegistry, type TurboModule} from 'react-native';

export interface Spec extends TurboModule {
  +startReportAProblemFlow: () => void;
  +setExtraData: (extraData: Object, extraFiles: Object) => void;
  +setCategoryID: (categoryID: string) => void;
}

export default (TurboModuleRegistry.get<Spec>('BugReporting'): ?Spec);
