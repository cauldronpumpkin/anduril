'use strict';

import {createAppContainer} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';

import Chat from '../pages/Chat';
import Scanner from '../pages/Scanner';
import Loading from '../pages/Loading';

const screens = {
  Scanner: {
    screen: Scanner,
  },
  Chat: {
    screen: Chat,
    navigationOptions: {
      headerShown: false
    }
  },
  Loading: {
    screen: Loading,
    navigationOptions: {
      headerShown: false
    }
  },
};

const HomeStack = createStackNavigator(screens);

export default createAppContainer(HomeStack);
