import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';

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

  return (
    <View style={[styles.container, styles.horizontal]}>
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
