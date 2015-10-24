/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var React = require('React');

var SwitchAndroid = require('SwitchAndroid');
var Text = require('Text');
var UIExplorerBlock = require('UIExplorerBlock');
var UIExplorerPage = require('UIExplorerPage');

var SwitchAndroidExample = React.createClass({
  statics: {
    title: '<SwitchAndroid>',
    description: 'Standard Android two-state toggle component.'
  },

  getInitialState : function() {
    return {
      trueSwitchIsOn: true,
      falseSwitchIsOn: false,
      colorTrueSwitchIsOn: true,
      colorFalseSwitchIsOn: false,
      eventSwitchIsOn: false,
    };
  },

  render: function() {
    return (
      <UIExplorerPage title="<SwitchAndroid>">
        <UIExplorerBlock title="Switches can be set to true or false">
          <SwitchAndroid
            onValueChange={(value) => this.setState({falseSwitchIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.falseSwitchIsOn} />
          <SwitchAndroid
            onValueChange={(value) => this.setState({trueSwitchIsOn: value})}
            value={this.state.trueSwitchIsOn} />
        </UIExplorerBlock>
        <UIExplorerBlock title="Switches can be disabled">
          <SwitchAndroid
            disabled={true}
            style={{marginBottom: 10}}
            value={true} />
          <SwitchAndroid
            disabled={true}
            value={false} />
        </UIExplorerBlock>
        <UIExplorerBlock title="Change events can be detected">
          <SwitchAndroid
            onValueChange={(value) => this.setState({eventSwitchIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventSwitchIsOn} />
          <SwitchAndroid
            onValueChange={(value) => this.setState({eventSwitchIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventSwitchIsOn} />
          <Text>{this.state.eventSwitchIsOn ? 'On' : 'Off'}</Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Switches are controlled components">
          <SwitchAndroid />
          <SwitchAndroid value={true} />
        </UIExplorerBlock>
      </UIExplorerPage>
    );
  }
});

module.exports = SwitchAndroidExample;
