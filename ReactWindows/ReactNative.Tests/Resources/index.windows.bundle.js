'use strict';

var React = require('react-native');
var {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    } = React;

    var ReactRoot = React.createClass({
    render: function() {
        return (
          <View>
              <div>
                Welcome to React Native!
              </div>
          </View>
        );
    }
 });

AppRegistry.registerComponent('ReactRoot', () => ReactRoot);