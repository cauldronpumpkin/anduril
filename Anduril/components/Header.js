import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const Header = () => {
  return (
    <View style={styles.header}>
      <Text style={styles.text}>Anduril</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 50,
    padding: 10,
    backgroundColor: '#18B0FF',
  },
  text: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'left',
    paddingLeft: 5
  },
});

export default Header;