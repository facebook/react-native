import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

const links = [
    {
        title: 'The Basics',
        link: 'https://facebook.github.io/react-native/docs/tutorial',
        description: 'Read the docs on what do do once seeing how to work in React Native.'
    },
    {
        title: 'Style',
        link: 'https://facebook.github.io/react-native/docs/style',
        description: 'All of the core components accept a prop named style.'
    },
    {
        title: 'Layout',
        link: 'https://facebook.github.io/react-native/docs/flexbox',
        description: 'A component can specify the layout of its children using the flexbox specification.'
    },
    {
        title: 'Components',
        link: 'https://facebook.github.io/react-native/docs/components-and-apis',
        description: 'The full list of components and APIs inside React Native.'
    },
    {
        title: 'Navigation',
        link: 'https://facebook.github.io/react-native/docs/navigation',
        description: 'How to handle moving between screens inside your application.'
    },
    {
        title: 'Networking',
        link: 'https://facebook.github.io/react-native/docs/network',
        description: 'How to use the Fetch API in React Native.'
    },
    {
        title: 'Help',
        link: 'https://facebook.github.io/react-native/help',
        description: 'Need more help? There are many other React Native developers who may have the answer.'
    }
]

function LinkList() {
    return <View style={styles.container}>
        <View style={styles.separator}/>
        {
            links.map((item, index) => {
                return <View key={index}>
                    <TouchableOpacity
                        onPress={() => Linking.openURL(item.link)}
                        style={styles.linkContainer}
                    >
                        <Text style={styles.link}>{item.title}</Text>
                        <View style={styles.descriptionContainer}>
                            <Text style={styles.description}>{item.description}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.separator}/>
                </View>
            })
        }
    </View>
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 25,
        paddingHorizontal: 15
    },
    linkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5
    },
    link: {
        fontSize: 15,
        fontWeight: '400',
        color: '#1292B4',
        width: '35%'
    },
    descriptionContainer: {
        width: '65%',
        justifyContent: 'center',
        paddingBottom: 13
    },
    description: {
        fontSize: 13,
        fontWeight: '400',
        color: '#1292B4'
    },
    separator: {
        backgroundColor: '#DAE1E7',
        height: 1
    },
    title: {
        fontSize: 25,
        fontWeight: '500'
    },
    description: {
        fontSize: 15,
        fontWeight: '400',
        paddingTop: 15
    }
});

export default LinkList