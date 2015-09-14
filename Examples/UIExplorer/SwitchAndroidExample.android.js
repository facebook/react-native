/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
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
    description: 'Standard Android two-state toggle component'
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
          <Text>{this.state.eventSwitchIsOn ? "On" : "Off"}</Text>
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
