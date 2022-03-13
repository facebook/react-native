import React from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
  Text,
  StatusBar,
} from 'react-native';

const DATA = [
  {
    id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
    title: 'First Item',
  },
  {
    id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
    title: 'Second Item',
  },
  {
    id: '58694a0f-3da1-471f-bd96-145571e29d72',
    title: 'Third Item',
  },
  {
    id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb8bbb',
    title: 'Fourth Item',
  },
  {
    id: '3ac68afc-c605-48d3-a4f8-fbd91aa97676',
    title: 'Fifth Item',
  },
  {
    id: '58694a0f-3da1-471f-bd96-145571e27234',
    title: 'Sixth Item',
  },
  {
    id: '58694a0f-3da1-471f-bd96-145571e29234',
    title: 'Seven Item',
  },
  {
    id: '58694a0f-3da1-471f-bd96-145571429234',
    title: 'Eight Item',
  },
  {
    id: '58694a0f-3da1-471f-bd96-115571429234',
    title: 'Nine Item',
  },
  {
    id: '58694a0f-3da1-471f-bd96-1155h1429234',
    title: 'Ten Item',
  },
];

const Item = ({item, accessibilityCollectionItem}) => (
  <View
    importantForAccessibility="yes"
    accessibilityCollectionItem={accessibilityCollectionItem}
    style={styles.item}>
      <Text style={styles.title}>{item.title}</Text>
  </View>
);

const renderItem = (props) => <Item {...props} />;

const renderFlatList = ({item}) => {
  return (
    <View>
      <Text>Flatlist {item}</Text>
      <FlatList renderItem={renderItem} horizontal data={DATA} />
    </View>
  );
};

const FlatListNested = () => {
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[1, 2, 3]}
        renderItem={renderFlatList}
        keyExtractor={(item) => item.toString()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
  },
});

exports.title = 'FlatList Nested';
exports.testTitle = 'Test accessibility announcement in nested flatlist';
exports.category = 'ListView';
exports.documentationURL = 'https://reactnative.dev/docs/flatlist';
exports.description = 'Nested flatlist example';
exports.examples = [
  {
    title: 'FlatList Nested example',
    render: function (): React.Element<typeof FlatListNested> {
      return <FlatListNested />;
    },
  },
];
