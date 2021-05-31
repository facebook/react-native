'use strict';

const React = require('react');

const {
  Button,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} = require('react-native');

class ScrollViewIndicatorInsetsExample extends React.Component<
  {...},
  {|
    enableAutoIndicatorInsets: boolean,
    modalPresentationStyle: string,
    modalVisible: boolean,
  |},
> {
  state = {
    enableAutoIndicatorInsets: true,
    modalPresentationStyle: null,
    modalVisible: false,
  };

  _setModalVisible = (modalVisible, modalPresentationStyle) => {
    this.setState({
      enableAutoIndicatorInsets: true,
      modalVisible,
      modalPresentationStyle,
    });
  };

  _setEnableAutoIndicatorInsets = enableAutoIndicatorInsets => {
    this.setState({
      enableAutoIndicatorInsets,
    });
  };

  render() {
    const {height, width} = Dimensions.get('window');
    return (
      <View>
        <Modal
          animationType="slide"
          visible={this.state.modalVisible}
          onRequestClose={() => this._setModalVisible(false)}
          presentationStyle={this.state.modalPresentationStyle}
          statusBarTranslucent={false}
          supportedOrientations={['portrait', 'landscape']}>
          <View style={styles.modal}>
            <ScrollView
              contentContainerStyle={[
                styles.scrollViewContent,
                {
                  height: (height * 1.2),
                  width: (width * 1.2),
                },
              ]}
              automaticallyAdjustsScrollIndicatorInsets={this.state.enableAutoIndicatorInsets}
              style={styles.scrollView}>
              <Text>automaticallyAdjustsScrollIndicatorInsets</Text>
              <Switch
                onValueChange={v => this._setEnableAutoIndicatorInsets(v)}
                value={this.state.enableAutoIndicatorInsets}
                style={styles.switch}/>
              <Button
                onPress={() => this._setModalVisible(false)}
                title="Close"/>
            </ScrollView>
          </View>
        </Modal>
        <Button
          onPress={() => this._setModalVisible(true, 'pageSheet')}
          title="Present Sheet Modal with ScrollView"/>
        <Button
          onPress={() => this._setModalVisible(true, 'fullscreen')}
          title="Present Fullscreen Modal with ScrollView"/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    height: 1000,
  },
  scrollViewContent: {
    alignItems: 'center',
    backgroundColor: '#ffaaaa',
    justifyContent: 'flex-start',
    paddingTop: 200,
  },
  switch: {
    marginBottom: 40,
  },
});

exports.title = 'ScrollViewIndicatorInsets';
exports.category = 'iOS';
exports.description =
  'ScrollView automaticallyAdjustsScrollIndicatorInsets adjusts scroll indicator insets using OS-defined logic on iOS 13+.';
exports.examples = [
  {
    title: '<ScrollView> automaticallyAdjustsScrollIndicatorInsets Example',
    render: (): React.Node => <ScrollViewIndicatorInsetsExample/>,
  },
];
