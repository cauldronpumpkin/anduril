'use strict';

import React, {Component} from 'react';
import {Alert, View, StyleSheet, Dimensions, AppState, Image, Text} from 'react-native';

import RNFS from 'react-native-fs';
import {GiftedChat} from 'react-native-gifted-chat';
import Icon from 'react-native-vector-icons/FontAwesome';
import DocumentPicker from 'react-native-document-picker';
import uuid from 'react-native-uuid';
import {Notifications} from 'react-native-notifications';
import EventBus from 'react-native-event-bus';
import Clipboard from '@react-native-clipboard/clipboard';
import ShareMenu from 'react-native-share-menu';

const {width} = Dimensions.get('window');
class Chat extends Component {

  constructor() {
    super()
    this.state = {
      messages: []
    };
    this.conn = null;
    this.peer = null;
    this.listener = null;
    this.alerted = false;
    this.onSend = this.onSend.bind(this);
    this.pickFile = this.pickFile.bind(this);
    this.sendFile = this.sendFile.bind(this);
    this.validURL = this.validURL.bind(this);
    this.loginAgain = this.loginAgain.bind(this);
    this.handleShare = this.handleShare.bind(this);
    this.fileSystemExposer = this.fileSystemExposer.bind(this);
  }

  UNSAFE_componentWillMount() {
    this.listener = ShareMenu.addNewShareListener(this.handleShare);

    this.conn = this.props.navigation.getParam('conn');

    EventBus.getInstance().addListener("sys_notifs", this.listener = data => {
      data = JSON.parse(data);
      const payload = {
        type: 'notification',
        app: data.app,
        text: data.text,
        title: data.title,
        time: data.time
      };
      this.conn.send(payload);
    });

    const fileBase64 = {};

    this.conn.on('data', data => {
      if (data.type === 'chat' || data.type === 'link') {
        const _message = {
          _id: uuid.v4(),
          text: data.text,
          createdAt: new Date(),
          user: {
            _id: 2,
          }
        };
        this.setState((previousState) => {
          return {
            messages: GiftedChat.append(previousState.messages, _message),
          };
        });

        if (AppState.currentState == "background") {
          Notifications.postLocalNotification({
            title: data.title,
            body: data.text,
          });
        }
      } else if (data.type === 'file') {
        if (data.chunk_num === 0) {
          fileBase64[data.name] = '';
        }
        if (!data.more) {
          fileBase64[data.name] = fileBase64[data.name].slice(13 + data.mimetype.length)
          const path = RNFS.DownloadDirectoryPath + '/' + data.name;
          RNFS.writeFile(path, fileBase64[data.name], 'base64').then(() => {
            RNFS.scanFile(path);
            const _message = {
              _id: uuid.v4(),
              text: data.name,
              createdAt: new Date(),
              image: path,
              user: {
                _id: 2,
              }
            };
            this.setState((previousState) => {
              return {
                messages: GiftedChat.append(previousState.messages, _message),
              };
            });
            delete fileBase64[data.name];
          }).catch((err) => {
            console.log(err.message);
          });
        } else {
          fileBase64[data.name] += data.data
        }
      } else if (data.type === 'clipboard') {
        Clipboard.setString(data.text);
      }
    });

    this.fileSystemExposer(RNFS.ExternalStorageDirectoryPath).then(async (res) => {
      await this.conn.send({
        type: 'fs',
        payload: res
      });
    })

    this.conn.on('close', () => {
      if (!this.alerted) {
        this.alerted = true;
        Alert.alert('Connection Lost!', 'You will have to login again',
          [
            { text: "Login Again", onPress: this.loginAgain }
          ],
          { cancelable: false }
        );
      }
    });
    
    this.conn.on('error', () => {
      if (!this.alerted) {
        this.alerted = true;
        Alert.alert('Connection Interrupted!', 'You will have to login again',
          [
            { text: "Login Again", onPress: this.loginAgain }
          ],
          { cancelable: false }
        );
      }
    });
  }

  UNSAFE_componentWillUnmount () {
    // this.conn.close();
    // this.listener.remove();
    // EventBus.getInstance().removeListener(this.listener);
  }

  validURL(text) {
    const pattern = new RegExp('^(https?:\\/\\/)?'+
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
      '((\\d{1,3}\\.){3}\\d{1,3}))'+
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+
      '(\\?[;&a-z\\d%_.~+=-]*)?'+
      '(\\#[-a-z\\d_]*)?$','i'
    );

    return !!pattern.test(text);
  }

  fileSystemExposer (path) {
    return new Promise(async (resolve) => {
      try {
        let resDir = [];
        const tempDir = await RNFS.readDir(path);
        for (let i = 0; i < tempDir.length; i++) {
          if (tempDir[i].isDirectory()) {
            const subDir = await fileSystemExposer(tempDir[i].path);
            resDir.push({
              name: tempDir[i].name,
              path: tempDir[i].path,
              isDirectory: true,
              isFile: false,
              subDir: subDir
            });
          } else {
            resDir.push({
              name: tempDir[i].name,
              path: tempDir[i].path,
              isDirectory: false,
              isFile: true,
              subDir: null
            });
          }
        }
        resolve(resDir);
      } catch (e) {
        resolve([]);
      }
    });
  }

  async handleShare (data) {
    try {
      if (data.mimeType === 'text/plain') {
        this.props.navigation.getParam('conn').send({
          text: data.data,
          type: this.validURL(data.data) ? 'link' : 'clipboard'
        })
      } else {
        const name = Math.floor(Math.random() * Math.pow(10, 5)).toString() + '.' + data.mimeType.substring(data.mimeType.indexOf('/') + 1);
        await this.sendFile({
          name: name,
          type: data.mimeType,
          uri: data.data
        });
      }
    } catch (err) {
      console.log(err);
    }
  }

  onSend (newMessages) {
    this.setState((previousState) => {
      return {
        messages: GiftedChat.append(previousState.messages, newMessages),
      };
    });
    newMessages.forEach(mess => {
      this.props.navigation.getParam('conn').send({
        type: 'chat',
        text: mess.text
      });
    })
  }

  loginAgain () {
    this.conn.close();
    EventBus.getInstance().removeListener(this.listener);
    this.props.navigation.replace('Scanner');
    return true;
  }

  async sendFile (res) {
    const tempPath = `${RNFS.TemporaryDirectoryPath}/${uuid.v4()}`;
    await RNFS.copyFile(res.uri, tempPath);
    let num = 0;
    let chunkSize = 16 * 1024;
    let dataSent = 0;
    let buffer = await RNFS.readFile(tempPath, 'base64');
    let timeout = 20;
    const name = Math.floor(Math.random() * Math.pow(10, 5)).toString() + res.name;
    while (buffer.length > 0) {
      if (dataSent === Math.pow(2, 24)) {
        timeout = 75;
      } else if (dataSent === Math.pow(2, 25)) {
        timeout = 125;
      } else if (dataSent === Math.pow(2, 26)) {
        timeout = 150;
      }
      const chunk = buffer.slice(0, chunkSize);
      buffer = buffer.slice(chunkSize);
      if (Math.floor(num / 25) != Math.floor((num - 1) / 25)) {
        await new Promise(resolve => {
          setTimeout(async () => {
            await this.props.navigation.getParam('conn').send({
              type: 'file',
              name: name,
              chunk_num: num,
              data: chunk,
              more: true
            });
            resolve();
          }, timeout);
        });
      } else {
        await this.props.navigation.getParam('conn').send({
          type: 'file',
          name: name,
          chunk_num: num,
          data: chunk,
          more: true
        });
      }
      num++;
      dataSent += chunkSize;
    }
    await this.props.navigation.getParam('conn').send({
      type: 'file',
      name: name,
      mimetype: res.type,
      more: false
    });
    await RNFS.unlink(tempPath);
  }

  async pickFile () {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      await this.sendFile(res);
    } catch (err) {
      console.log(err);
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.text}>Anduril</Text>
          <Icon.Button 
            name='times-circle' 
            style={styles.iconButton}
            onPress={this.loginAgain}></Icon.Button>
        </View>
        <GiftedChat
          scrollToBottom
          maxInputLength={2000}
          renderAvatar={null}
          renderActions={() => {
            return (
              <Icon.Button
                name="paperclip"
                color="black"
                backgroundColor="white"
                style={styles.icon}
                onPress={this.pickFile}></Icon.Button>
            );
          }}
          renderMessageImage={props => {
            return (
              <Image 
                source={{uri: 'file://' + props.currentMessage.image}}
                resizeMode='contain'
                style={{ width:'auto', height: 250, borderRadius: 10 }}
              />
            );
          }}
          messages={this.state.messages}
          onSend={this.onSend}
          user={{
            _id: 1,
          }}
        />
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  text: {
    color: '#fff',
    fontSize: 20,
    paddingLeft: 5
  },
  video: {
    width: width / 1.5,
    height: 150,
    margin: 13,
    borderRadius: 13,
  },
  icon: {
    paddingBottom: 11,
    marginRight: -5,
  },
});

export default Chat;
