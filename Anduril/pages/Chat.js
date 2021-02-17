'use strict';

import React, {Component} from 'react';
import {Text, View, StyleSheet, Dimensions, BackHandler, Alert, AppState} from 'react-native';

import RNFS from 'react-native-fs';
import {GiftedChat, Time} from 'react-native-gifted-chat';
import Icon from 'react-native-vector-icons/FontAwesome';
import DocumentPicker from 'react-native-document-picker';
import uuid from 'react-native-uuid';
import {Notifications} from 'react-native-notifications';
import EventBus from 'react-native-event-bus';

const {width} = Dimensions.get('window');

class Chat extends Component {

  constructor() {
    super()
    this.state = {
      messages: []
    };
    this.listener = null,
    this.onSend = this.onSend.bind(this);
    this.pickFile = this.pickFile.bind(this);
    this.handleBackButton = this.handleBackButton.bind(this);
  }

  UNSAFE_componentWillMount() {
    // BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);

    const conn = this.props.navigation.getParam('conn');

    EventBus.getInstance().addListener("sys_notifs", this.listener = data => {
      data = JSON.parse(data);
      const payload = {
        type: 'notification',
        app: data.app,
        text: data.text,
        title: data.title,
        time: data.time
      };
      conn.send(payload);
    });

    let fileBase64 = '';

    conn.on('data', data => {
      if (data.type === 'chat') {
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
            body: data.text
          });
        }
      } else if (data.type === 'file') {
        if (Math.floor(data.chunk_num / 1000) === data.chunk_num / 1000) {
          console.log(data.chunk_num)
        }
        if (!data.more) {
          fileBase64 = fileBase64.slice(13 + data.file_type.length)
          const path = RNFS.DownloadDirectoryPath + `/${Math.random().toString() + data.name}`;
          RNFS.writeFile(path, fileBase64, 'base64').then(() => {
            RNFS.scanFile(path);
          }).catch((err) => {
            console.log(err.message);
          });

          fileBase64 = ''
        } else {
          fileBase64 += data.data
        }
      }
    });
  }

  UNSAFE_componentWillUnmount() {
    // BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
    EventBus.getInstance().removeListener(this.listener);
  }

  handleBackButton() {
    Alert.alert("Are You Sure?", "If you exit this App you will not recieve Notifications!", [
      {
        text: "Cancel",
        onPress: () => null,
        style: "cancel"
      },
      {text: "YES", onPress: () => BackHandler.exitApp()}
    ]);
    return true;
  };

  onSend(newMessages) {
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
  };

  async pickFile() {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      const tempPath = `${RNFS.TemporaryDirectoryPath}/${uuid.v4()}`;
      await RNFS.copyFile(res.uri, tempPath);
      let num = 0;
      let chunkSize = 8 * 1024;
      let buffer = await RNFS.read(tempPath, chunkSize, 0, 'base64');
      console.log(buffer.slice(0, 50));
      while (buffer.length > 0) {
        if (num == 1000) {
          chunkSize = 4 * 1024;
        } else if (num == 25000) {
          chunkSize = 2 * 1024;
        }
        await this.props.navigation.getParam('conn').send({
          type: 'file',
          chunk_num: num,
          data: buffer,
          more: true
        });
        num++;
        buffer = await RNFS.read(tempPath, chunkSize, num * chunkSize, 'base64');
      }
      await this.props.navigation.getParam('conn').send({
        type: 'file',
        name: res.name,
        file_type: res.type,
        more: false
      });
      await RNFS.unlink(tempPath);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker, exit any dialogs or menus and move on
      } else {
        throw err;
      }
    }
  };

  render() {
    return (
      <View style={styles.container}>
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
