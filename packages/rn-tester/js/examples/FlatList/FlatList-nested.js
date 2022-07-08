import React from "react";
import {
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
  Text,
  StatusBar,
  Button,
} from "react-native";

const DATA = [
  {
    id: "bd7acbea-c1b1-46c2-aed5-3ad53abb28ba",
    title: "First Item",
  },
  {
    id: "3ac68afc-c605-48d3-a4f8-fbd91aa97f63",
    title: "Second Item",
  },
  {
    id: "58694a0f-3da1-471f-bd96-145571e29d72",
    title: "Third Item",
  },
  {
    id: "bd7acbea-c1b1-46c2-aed5-3ad53abb8bbb",
    title: "Fourth Item",
  },
  {
    id: "3ac68afc-c605-48d3-a4f8-fbd91aa97676",
    title: "Fifth Item",
  },
  {
    id: "58694a0f-3da1-471f-bd96-145571e27234",
    title: "Sixth Item",
  },
  {
    id: "58694a0f-3da1-471f-bd96-145571e29234",
    title: "Seven Item",
  },
  {
    id: "58694a0f-3da1-471f-bd96-145571429234",
    title: "Eight Item",
  },
  {
    id: "58694a0f-3da1-471f-bd96-115571429234",
    title: "Nine Item",
  },
  {
    id: "58694a0f-3da1-471f-bd96-1155h1429234",
    title: "Ten Item",
  },
];

const Item = ({ title }) => (
  <Text style={[styles.item, styles.title]}>{title}</Text>
);

const renderItem = ({ item }) => <Item title={item.title} />;
const ITEM_HEIGHT = 50;

const renderFlatList = ({ item }) => (
  <NestedFlatList item={item} />
);

function NestedFlatList(props) {
  const [items, addItem] = React.useState(DATA);
  return (
    <View>
      <Button
      title="add an item"
      onPress={() => addItem([...items, {title: 'new item'}])}
      />
      <Text>Flatlist</Text>
      <FlatList
        style={{height: 400}}
        inverted={true}
        renderItem={renderItem} data={items} />
    </View>
  )
}

const FlatList_nested = () => {
  let flatlist = React.useRef(0);
  return (
    <FlatList
      ref={(ref) => flatlist = ref}
      data={[1,2,3]}
      horizontal
      renderItem={renderFlatList}
      keyExtractor={(item) => item.toString()}
    />
  );
};

const styles = StyleSheet.create({
  item: {
    backgroundColor: "#f9c2ff",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
  },
});

export default ({
  title: 'Nested',
  name: 'nested',
  description: 'nested FlatList',
  render: () => <FlatList_nested />,
}: RNTesterModuleExample);
