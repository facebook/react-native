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
 *
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  AppRegistry,
  Settings,
  StyleSheet,
} = React;

var { TestModule } = React.addons;

import type { NavigationContext } from 'NavigationContext';

var UIExplorerListBase = require('./UIExplorerListBase');

var COMPONENTS = [
  require('./ActivityIndicatorIOSExample'),
  require('./DatePickerIOSExample'),
  require('./ImageExample'),
  require('./LayoutEventsExample'),
  require('./ListViewExample'),
  require('./ListViewGridLayoutExample'),
  require('./ListViewPagingExample'),
  require('./MapViewExample'),
  require('./Navigator/NavigatorExample'),
  require('./NavigatorIOSColorsExample'),
  require('./NavigatorIOSExample'),
  require('./PickerIOSExample'),
  require('./ProgressViewIOSExample'),
  require('./ScrollViewExample'),
  require('./SegmentedControlIOSExample'),
  require('./SliderIOSExample'),
  require('./SwitchIOSExample'),
  require('./TabBarIOSExample'),
  require('./TextExample.ios'),
  require('./TextInputExample'),
  require('./TouchableExample'),
  require('./ViewExample'),
  require('./WebViewExample'),
];

var APIS = [
  require('./AccessibilityIOSExample'),
  require('./ActionSheetIOSExample'),
  require('./AdSupportIOSExample'),
  require('./AlertIOSExample'),
  require('./AnimationExample/AnExApp'),
  require('./AppStateIOSExample'),
  require('./AsyncStorageExample'),
  require('./BorderExample'),
  require('./CameraRollExample.ios'),
  require('./GeolocationExample'),
  require('./LayoutExample'),
  require('./NetInfoExample'),
  require('./PanResponderExample'),
  require('./PointerEventsExample'),
  require('./PushNotificationIOSExample'),
  require('./StatusBarIOSExample'),
  require('./TimerExample'),
  require('./VibrationIOSExample'),
  require('./XHRExample'),
];

// Register suitable examples for snapshot tests
COMPONENTS.concat(APIS).forEach((Example) => {
  if (Example.displayName) {
    var Snapshotter = React.createClass({
      componentDidMount: function() {
        // View is still blank after first RAF :\
        global.requestAnimationFrame(() =>
          global.requestAnimationFrame(() => TestModule.verifySnapshot(
            TestModule.markTestPassed
          )
        ));
      },
      render: function() {
        var Renderable = UIExplorerListBase.makeRenderable(Example);
        return <Renderable />;
      },
    });
    AppRegistry.registerComponent(Example.displayName, () => Snapshotter);
  }
});

type Props = {
  navigator: {
    navigationContext: NavigationContext,
    push: (route: {title: string, component: ReactClass<any,any,any>}) => void,
  },
  onExternalExampleRequested: Function,
};

class UIExplorerList extends React.Component {
  props: Props;

  render() {
    return (
      <UIExplorerListBase
        components={COMPONENTS}
        apis={APIS}
        searchText={Settings.get('searchText')}
        renderAdditionalView={this.renderAdditionalView.bind(this)}
        search={this.search.bind(this)}
        onPressRow={this.onPressRow.bind(this)}
      />
    );
  }

  componentWillMount() {
    this.props.navigator.navigationContext.addListener('didfocus', function(event) {
      if (event.data.route.title === 'UIExplorer') {
        Settings.set({visibleExample: null});
      }
    });
  }

  componentDidMount() {
    var visibleExampleTitle = Settings.get('visibleExample');
    if (visibleExampleTitle) {
      var predicate = (example) => example.title === visibleExampleTitle;
      var foundExample = APIS.find(predicate) || COMPONENTS.find(predicate);
      if (foundExample) {
        setTimeout(() => this._openExample(foundExample), 100);
      }
    }
  }

  renderAdditionalView(renderRow: Function, renderTextInput: Function): React.Component {
    return renderTextInput(styles.searchTextInput);
  }

  search(text: mixed) {
    Settings.set({searchText: text});
  }

  _openExample(example: any) {
    if (example.external) {
      this.props.onExternalExampleRequested(example);
      return;
    }

    var Component = UIExplorerListBase.makeRenderable(example);
    this.props.navigator.push({
      title: Component.title,
      component: Component,
    });
  }

  onPressRow(example: any) {
    Settings.set({visibleExample: example.title});
    this._openExample(example);
  }
}

var styles = StyleSheet.create({
  searchTextInput: {
    height: 30,
  },
});

module.exports = UIExplorerList;
