import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';

import Icon from 'react-native-vector-icons/FontAwesome';

import Peer from 'react-native-peerjs';

const Loading = ({navigation}) => {
  const localPeer = new Peer();
  localPeer.on('open', () => {
    const conn = localPeer.connect(navigation.getParam('peerId'));
    conn.on('open', async () => {
      const status = await RNAndroidNotificationListener.getPermissionStatus();
      if (status == 'denied' || status == 'unknown') {
        RNAndroidNotificationListener.requestPermission();
      }
      navigation.replace('Chat', {conn: conn});
    });
  });

  const resetApp = async () => {
    await AsyncStorage.removeItem('peer_id');
    navigation.replace('Scanner');
  };

  return (
    <View style={[styles.container, styles.horizontal]}>
      <View style={styles.header}>
          <Text style={styles.textHeader}>Loading</Text>
          <Icon.Button 
            name='times-circle' 
            style={styles.iconButton}
            onPress={resetApp}></Icon.Button>
      </View>
      <ActivityIndicator size="large" color="blue" style={styles.spinner} />
      <Text style={styles.text}>
        Please Don't Close Anduril on your Phone or Desktop.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    height: 50,
    padding: 10,
    flexDirection: 'row',
    backgroundColor: '#18B0FF',
    justifyContent: 'space-between'
  },
  iconButton: {
    paddingTop: 5,
    paddingBottom: 10,
    marginRight: -10,
    color: 'black',
    backgroundColor: '#18B0FF'
  },
  textHeader: {
    color: '#fff',
    fontSize: 20,
    paddingLeft: 5
  },
  horizontal: {
    flexDirection: 'column',
    padding: 10,
  },
  text: {
    fontSize: 27,
    paddingLeft: 15,
  },
  spinner: {
    paddingBottom: 30,
  },
});

export default Loading;
