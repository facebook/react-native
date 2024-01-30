import React, {memo} from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

const pokedex: Pokemon[] = require('./pokedex.json');

interface Pokemon {
  gameIndex: string;
  name: string;
  types: {name: string}[];
  imageUrl: string;
}
// Taken directly from https://github.com/MatheusPires99/pokedex
const POKEMON_TYPE_COLORS: {[type: string]: string} = {
  normal: '#A8A878',
  fighting: '#C03028',
  flying: '#A890F0',
  poison: '#A040A0',
  ground: '#E0C068',
  rock: '#B8A038',
  bug: '#A8B820',
  ghost: '#705898',
  steel: '#B8B8D0',
  fire: '#FA6C6C',
  water: '#6890F0',
  grass: '#48CFB2',
  electric: '#FFCE4B',
  psychic: '#F85888',
  ice: '#98D8D8',
  dragon: '#7038F8',
  dark: '#705848',
  fairy: '#EE99AC',
};

/**
 * Having 4 columns is voluntarily a bit extreme, so we can have more granularity to compare CPU usage between releases
 */
const COLUMN_COUNT = 4;

const cardStyles = StyleSheet.create({
  container: {width: `${100 / COLUMN_COUNT}%`},
  innerContainer: {
    padding: (10 * 2) / COLUMN_COUNT,
    paddingRight: 0,
    margin: (5 * 2) / COLUMN_COUNT,
    borderRadius: (10 * 2) / COLUMN_COUNT,
    elevation: 7,
  },
  name: {
    fontSize: (16 * 2) / COLUMN_COUNT,
    color: 'white',
    fontWeight: 'bold',
    flex: 1,
    paddingRight: (5 * 2) / COLUMN_COUNT,
  },
  typeContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6662',
    borderRadius: (10 * 2) / COLUMN_COUNT,
    marginTop: (5 * 2) / COLUMN_COUNT,
    padding: (5 * 2) / COLUMN_COUNT,
  },
  nameAndIndexContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingRight: (10 * 2) / COLUMN_COUNT,
  },
  index: {fontSize: (12 * 2) / COLUMN_COUNT, color: '#6666'},
  type: {
    color: '#fffa',
    fontSize: (12 * 2) / COLUMN_COUNT,
  },
  image: {width: (100 * 2) / COLUMN_COUNT, height: (100 * 2) / COLUMN_COUNT},
  typesContainer: {flex: 1, paddingTop: (20 * 2) / COLUMN_COUNT},
  typeRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
});

const PokemonCard = memo(({item}: {item: Pokemon}) => {
  return (
    <View style={cardStyles.container}>
      <View
        style={[
          cardStyles.innerContainer,
          {
            backgroundColor: POKEMON_TYPE_COLORS[item.types[0].name],
          },
        ]}>
        <View style={cardStyles.nameAndIndexContainer}>
          <Text numberOfLines={1} style={cardStyles.name}>
            {item.name.toUpperCase()}
          </Text>
          <Text style={cardStyles.index}>#{item.gameIndex}</Text>
        </View>
        <View style={cardStyles.typeRow}>
          <View style={cardStyles.typesContainer}>
            {item.types.map(type => (
              <View key={type.name} style={cardStyles.typeContainer}>
                <Text style={cardStyles.type}>{type.name}</Text>
              </View>
            ))}
          </View>
          {item.imageUrl && (
            <Image
              source={{uri: item.imageUrl}}
              style={cardStyles.image}
            />
          )}
        </View>
      </View>
    </View>
  );
});

const renderItem = ({item}: {item: Pokemon}) => {
  return <PokemonCard item={item} />;
};

const styles = StyleSheet.create({list: {paddingHorizontal: 5}});

export const FlatListExample = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <FlatList
        numColumns={COLUMN_COUNT}
        keyExtractor={item => item.name}
        data={pokedex}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};
