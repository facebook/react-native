'use strict';

var React = require('react-native');
var {AppRegistry, View} = React;

    var ReactRoot = React.createClass({
    render: function() {
        return (
              <View elevation="1.0">
              </View>
        );
    }
 });

AppRegistry.registerComponent('ReactRoot', () => ReactRoot);