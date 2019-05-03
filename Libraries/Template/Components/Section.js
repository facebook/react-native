import React from 'react'
import { View, StyleSheet } from 'react-native'
import PropTypes from 'prop-types'

const Section = ({ children }) => (
  <View style={styles.container}>{children}</View>
)

Section.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
})

export default Section
