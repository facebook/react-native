// @flow strict-local

import type {HostComponent, ViewProps} from 'react-native';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import {codegenNativeCommands} from 'react-native';

type NativeProps = $ReadOnly<{|
  ...ViewProps,
|}>;

export default (codegenNativeComponent<NativeProps>(
  'CustomView',
): HostComponent<NativeProps>);

interface NativeCommands {
  +startViewTransition: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
  +endViewTransition: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['startViewTransition', 'endViewTransition'],
});
