/**
 * @format
 */

// Must stay the first import: it patches Text before any screen loads
import './src/config/fontScaling';

import 'react-native-gesture-handler';
import {View, Text, TextInput} from 'react-native';


import {AppRegistry, LogBox} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// LogBox.ignoreAllLogs(true);

AppRegistry.registerComponent(appName, () => App);
