/**
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export type XRModuleConstants = {|
  +supportsMultipleScenes?: boolean,
|};

export interface Spec extends TurboModule {
  +getConstants: () => XRModuleConstants;

  +requestSession: (sessionId?: string) => Promise<void>;
  +endSession: () => Promise<void>;

  +openWindow: (windowId: string, userInfo: Object) => Promise<void>;
  +closeWindow: (windowId: string) => Promise<void>;
}

export default (TurboModuleRegistry.get<Spec>('XRModule'): ?Spec);
