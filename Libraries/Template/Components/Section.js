import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types'

function Section(props) {
    return <View style={styles.container}>
        <Text style={styles.title}>{props.title}</Text>
        <Text style={styles.description}>{props.description}</Text>
    </View>
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 25,
        paddingHorizontal: 15
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

Section.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string
}

export default Section