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
  ListView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} = React;
var createExamplePage = require('./createExamplePage');

var ds = new ListView.DataSource({
  rowHasChanged: (r1, r2) => r1 !== r2,
  sectionHeaderHasChanged: (h1, h2) => h1 !== h2,
});

class UIExplorerListBase extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = {
      dataSource: ds.cloneWithRowsAndSections({
        components: [],
        apis: [],
      }),
      searchText: this.props.searchText || '',
    };
  }

  componentDidMount(): void {
    this.search(this.state.searchText);
  }

  render() {
    var topView = this.props.renderAdditionalView &&
      this.props.renderAdditionalView(this.renderRow.bind(this), this.renderTextInput.bind(this));

    return (
      <View style={styles.listContainer}>
        {topView}
        <ListView
          style={styles.list}
          dataSource={this.state.dataSource}
          renderRow={this.renderRow.bind(this)}
          renderSectionHeader={this._renderSectionHeader}
          keyboardShouldPersistTaps={true}
          automaticallyAdjustContentInsets={false}
          keyboardDismissMode="on-drag"
        />
      </View>
    );
  }

  renderTextInput(searchTextInputStyle: any) {
    return (
      <View style={styles.searchRow}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="always"
          onChangeText={this.search.bind(this)}
          placeholder="Search..."
          style={[styles.searchTextInput, searchTextInputStyle]}
          testID="explorer_search"
          value={this.state.searchText}
        />
      </View>
    );
  }

  _renderSectionHeader(data: any, section: string) {
    return (
      <Text style={styles.sectionHeader}>
        {section.toUpperCase()}
      </Text>
    );
  }

  renderRow(example: any, i: number) {
    return (
      <View key={i}>
        <TouchableHighlight onPress={() => this.onPressRow(example)}>
          <View style={styles.row}>
            <Text style={styles.rowTitleText}>
              {example.title}
            </Text>
            <Text style={styles.rowDetailText}>
              {example.description}
            </Text>
          </View>
        </TouchableHighlight>
        <View style={styles.separator} />
      </View>
    );
  }

  search(text: mixed): void {
    this.props.search && this.props.search(text);

    var regex = new RegExp(String(text), 'i');
    var filter = (component) => regex.test(component.title);

    this.setState({
      dataSource: ds.cloneWithRowsAndSections({
        components: this.props.components.filter(filter),
        apis: this.props.apis.filter(filter),
      }),
      searchText: text,
    });
  }

  onPressRow(example: any): void {
    this.props.onPressRow && this.props.onPressRow(example);
  }

  static makeRenderable(example: any): ReactClass<any, any, any> {
    return example.examples ?
      createExamplePage(null, example) :
      example;
  }
}

var styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  list: {
    backgroundColor: '#eeeeee',
  },
  sectionHeader: {
    padding: 5,
    fontWeight: '500',
    fontSize: 11,
  },
  group: {
    backgroundColor: 'white',
  },
  row: {
    backgroundColor: 'white',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#bbbbbb',
    marginLeft: 15,
  },
  rowTitleText: {
    fontSize: 17,
    fontWeight: '500',
  },
  rowDetailText: {
    fontSize: 15,
    color: '#888888',
    lineHeight: 20,
  },
  searchRow: {
    backgroundColor: '#eeeeee',
    paddingTop: 75,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 10,
  },
  searchTextInput: {
    backgroundColor: 'white',
    borderColor: '#cccccc',
    borderRadius: 3,
    borderWidth: 1,
    paddingLeft: 8,
  },
});

module.exports = UIExplorerListBase;
