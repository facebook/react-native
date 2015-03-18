declare module "react-native" {
  declare class ListViewDataSource {
    constructor(params: Object): void;
  }

  declare var AppRegistry: ReactClass<any, any, any>;
  declare var Image: ReactClass<any, any, any>;
  declare var ListView: ReactClass<any, any, any>;
  declare var NavigatorIOS: ReactClass<any, any, any>;
  declare var NavigatorItemIOS: ReactClass<any, any, any>;
  declare var PixelRatio: ReactClass<any, any, any>;
  declare var ScrollView: ReactClass<any, any, any>;
  declare var ActivityIndicatorIOS: ReactClass<any, any, any>;
  declare var StyleSheet: ReactClass<any, any, any>;
  declare var Text: ReactClass<any, any, any>;
  declare var TextInput: ReactClass<any, any, any>;
  declare var TimerMixin: ReactClass<any, any, any>;
  declare var TouchableHighlight: ReactClass<any, any, any>;
  declare var TouchableWithoutFeedback: ReactClass<any, any, any>;
  declare var View: ReactClass<any, any, any>;
  declare var invariant: Function;
  declare var ix: Function;
}

declare module "addons" {
  declare var NavigatorIOS: ReactClass<any, any, any>;
  declare var NavigatorItemIOS: ReactClass<any, any, any>;
  declare var StyleSheet: ReactClass<any, any, any>;
}

declare var __DEV__: boolean;

declare module "fetch" {
  declare function exports(url: string, options?: Object): Object;
}
