import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';

const Header = () => {
  return (
    <View style={styles.header}>
      <Text style={styles.text}>Anduril</Text>
      <Icon.Button name='times-circle'></Icon.Button>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 50,
    padding: 10,
    backgroundColor: '#18B0FF',
    justifyContent: 'space-between'
  },
  text: {
    color: '#fff',
    fontSize: 20,
    paddingLeft: 5
  },
});

export default Header;