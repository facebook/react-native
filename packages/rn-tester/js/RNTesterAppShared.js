// @flow

import type { HostComponent } from 'react-native';
import type { ViewProps } from 'react-native/Libraries/Components/View/ViewPropTypes';
// TODO: this type is not exported from RN
import type {PartialViewConfig} from 'react-native/Libraries/Renderer/shims/ReactNativeTypes';

import React from 'react';
import {Button, View} from 'react-native';
import * as NativeComponentRegistry from 'react-native/Libraries/NativeComponent/NativeComponentRegistry';

// It seems like thats not how we add components to the JS view registry
// import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';


// I believe this is what codegen would autogenerate for us as Riccardo said
const viewConfig: PartialViewConfig = {
  uiViewClassName: 'CustomView',
  bubblingEventTypes: {},
  directEventTypes: {},
  validAttributes: {
    nativeProp: true,
  },
};

export type NativeProps = $ReadOnly<{
  ...ViewProps,
}>

const CustomView: HostComponent<NativeProps> =
  NativeComponentRegistry.get<NativeProps>(
    'CustomView',
    () => viewConfig
  );

function RNTesterApp() {
  const [state, setState] = React.useState(0);

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'lightblue'}}>
      <CustomView
        nativeProp={state.toString()}
        style={{
          width: 200,
          height: 200,
          backgroundColor: 'red',
        }}
      />
      <Button title="Increment" onPress={() => setState(state + 1)} />
    </View>
  );
}

export default RNTesterApp;
