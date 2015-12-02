'use strict';
var React = require('react-native');
var {
	AppRegistry,
	StyleSheet,
	Text,
	Image,
	View,
} = React;

var SecuritySettingPage = require('./SecuritySetting');

var SecuritySetting = React.createClass({
  render: function() {
    return (
    	<SecuritySettingPage/>
   );
 }
});

AppRegistry.registerComponent('SecuritySetting', () => SecuritySetting);
module.exports = SecuritySetting;