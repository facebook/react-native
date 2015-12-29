'use strict';

var React = require('react-native');
var {AppRegistry} = React;

    var ReactRoot = React.createClass({
    render: function() {
        return (
              <div>
                Welcome to React Native!
              </div>
        );
    }
 });

AppRegistry.registerComponent('ReactRoot', () => ReactRoot);