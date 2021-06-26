'use strict';

import React from 'react';

import {StyleSheet, Text, TouchableOpacity} from 'react-native';

import QRCodeScanner from 'react-native-qrcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Scanner = ({navigation}) => {
  const onSuccess = async (e) => {
    await AsyncStorage.setItem('peer_id', e.data);
    navigation.replace('Loading', {peerId: e.data});
  };

  AsyncStorage.getItem('peer_id').then(res => {
    if (res !== null) {
      navigation.replace('Loading', {peerId: res});
    }
  });

  return (
    <QRCodeScanner
      onRead={onSuccess}
      // flashMode={RNCamera.Constants.FlashMode.torch}
      topContent={
        <Text style={styles.centerText}>
          Open the Desktop Client of Anduril and scan its QR-Code.
        </Text>
      }
      bottomContent={
        <TouchableOpacity style={styles.buttonTouchable}>
          <Text style={styles.buttonText}>OK. Got it!</Text>
        </TouchableOpacity>
      }
    />
  );
};

const styles = StyleSheet.create({
  centerText: {
    flex: 1,
    fontSize: 18,
    padding: 32,
    color: '#777',
  },
  textBold: {
    fontWeight: '500',
    color: '#000',
  },
  buttonText: {
    fontSize: 21,
    color: 'rgb(0,122,255)',
  },
  buttonTouchable: {
    padding: 16,
  },
});

export default Scanner;
