'use strict';
var React = require('react-native');
var {
	AppRegistry,
	StyleSheet,
	Text,
	Image,
	View,
} = React;

var PrivacySettingPage = require('./PrivacySetting');

var PrivacySetting = React.createClass({
  render: function() {
    return (
    	<PrivacySettingPage/>
   );
 }
});

AppRegistry.registerComponent('PrivacySetting', () => PrivacySetting);
module.exports = PrivacySetting;