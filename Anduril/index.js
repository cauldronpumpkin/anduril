import {AppRegistry} from 'react-native'
import EventBus from 'react-native-event-bus'
import {RNAndroidNotificationListenerHeadlessJsName} from 'react-native-android-notification-listener'

import App from './App'
import {name as appName} from './app.json'

const headlessNotificationListener = async ({notification}) => {
  if (notification) {
    EventBus.getInstance().fireEvent("sys_notifs", notification);
  }
}

AppRegistry.registerHeadlessTask(
  RNAndroidNotificationListenerHeadlessJsName,
  () => headlessNotificationListener
)

AppRegistry.registerComponent(appName, () => App)
