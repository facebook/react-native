import React, {useEffect} from 'react';
import {requireNativeComponent, NativeModules} from 'react-native';

const RCTDrawerView = requireNativeComponent('RCTDrawerView');
//const RCTDrawerModule = NativeModules.TestModule;

//export const show = RCTDrawerModule.show;

export default function DrawerLayoutIos({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RCTDrawerView>{children}</RCTDrawerView>;
}
