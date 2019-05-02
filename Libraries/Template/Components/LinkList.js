import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'

const links = [
  {
    title: 'The Basics',
    link: 'https://facebook.github.io/react-native/docs/tutorial',
    description:
      'Read the docs on what do do once seeing how to work in React Native.',
  },
  {
    title: 'Style',
    link: 'https://facebook.github.io/react-native/docs/style',
    description: 'All of the core components accept a prop named style.',
  },
  {
    title: 'Layout',
    link: 'https://facebook.github.io/react-native/docs/flexbox',
    description:
      'A component can specify the layout of its children using the flexbox specification.',
  },
  {
    title: 'Components',
    link: 'https://facebook.github.io/react-native/docs/components-and-apis',
    description: 'The full list of components and APIs inside React Native.',
  },
  {
    title: 'Navigation',
    link: 'https://facebook.github.io/react-native/docs/navigation',
    description:
      'How to handle moving between screens inside your application.',
  },
  {
    title: 'Networking',
    link: 'https://facebook.github.io/react-native/docs/network',
    description: 'How to use the Fetch API in React Native.',
  },
  {
    title: 'Help',
    link: 'https://facebook.github.io/react-native/help',
    description:
      'Need more help? There are many other React Native developers who may have the answer.',
  },
]

export default (LinkList = () => (
  <View style={styles.container}>
    {links.map((item, index) => {
      return (
        <View key={index}>
          <View style={styles.separator} />
          <TouchableOpacity
            onPress={() => Linking.openURL(item.link)}
            style={styles.linkContainer}
          >
            <Text style={styles.link}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </TouchableOpacity>
        </View>
      )
    })}
  </View>
))

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  linkContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  link: {
    width: '40%',
    fontSize: 18,
    fontWeight: '400',
    color: '#1292B4',
  },
  description: {
    width: '60%',
    paddingVertical: 16,
    fontWeight: '400',
    fontSize: 18,
    color: '#333',
  },
  separator: {
    backgroundColor: '#DAE1E7',
    height: 1,
  },
})
