/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

if (global.RN$Bridgeless) {
  require('react-native/Libraries/NativeComponent/NativeComponentRegistry').setRuntimeConfigProvider(
    name => {
      // In bridgeless mode, never load native ViewConfig.
      return {native: false, strict: false, verify: false};
    },
  );
}

AppRegistry.registerComponent(appName, () => App);
