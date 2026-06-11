// import liraries
import React, { Component } from 'react';
import { View, Text, StyleSheet,Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneMap,TabBar } from 'react-native-tab-view';
import HeaderFix from '../../common/HeaderFix';
import Tryf from './Tryf';
import UI from '../../../config/styles/CommonStyles';
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const FirstRoute = () => (
//   <View style={{ flex: 1, backgroundColor: '#ff4081' }} />
    <Tryf />
);

const SecondRoute = () => (
  <View style={{ flex: 1, backgroundColor: '#673ab7' }} />
);


const renderScene = SceneMap({
  first: FirstRoute,
  second: SecondRoute,
});
const Legs = ({navigation}) => {
    const [index, setIndex] = React.useState(0);
    const [routes] = React.useState([
      { key: 'first', title: 'Left' },
      { key: 'second', title: 'Right' },
    ]);

    const renderTabBar = props => (
        <TabBar
          {...props}
          indicatorStyle={{ backgroundColor: 'white' }}
          style={{ backgroundColor: UI.color_Gradient[1] }}
          onTabPress={({ route, preventDefault }) => {
            if (route.key == 'first') {
            //   preventDefault();
                // props.navigation.navigate('Tryf');
                setIndex(1);
              // Do something else
            }
          }}
        />
      );


    return (
        <SafeAreaView style={{
            flex: 1,
        }}>
             <HeaderFix
            icon_left={'left'}
            onpress_left={() => {
            navigation.goBack();
            }}
            title={
                // this.props.route.params?.['name'] ?? 'DashBoard'
                "Foot Photo"
            }
            />
            <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            renderTabBar={renderTabBar}
            initialLayout={{ width: windowWidth }}
        />
      </SafeAreaView>
    );
};

export default Legs;





// import * as React from 'react';
// import { Animated, View, TouchableOpacity, StyleSheet } from 'react-native';
// import { TabView, SceneMap } from 'react-native-tab-view';

// const FirstRoute = () => (
//   <View style={[styles.container, { backgroundColor: '#ff4081' }]} />
// );
// const SecondRoute = () => (
//   <View style={[styles.container, { backgroundColor: '#673ab7' }]} />
// );

// export default class Legs extends React.Component {
//   state = {
//     index: 0,
//     routes: [
//       { key: 'first', title: 'First' },
//       { key: 'second', title: 'Second' },
//     ],
//   };

//   _handleIndexChange = (index) => this.setState({ index });

//   _renderTabBar = (props) => {
//     const inputRange = props.navigationState.routes.map((x, i) => i);

//     return (
//       <View style={styles.tabBar}>
//         {props.navigationState.routes.map((route, i) => {
//           const opacity = props.position.interpolate({
//             inputRange,
//             outputRange: inputRange.map((inputIndex) =>
//               inputIndex === i ? 1 : 0.5
//             ),
//           });

//           return (
//             <TouchableOpacity
//               style={styles.tabItem}
//               onPress={() => this.setState({ index: i })}>
//               <Animated.Text style={{ opacity }}>{route.title}</Animated.Text>
//             </TouchableOpacity>
//           );
//         })}
//       </View>
//     );
//   };

//   _renderScene = SceneMap({
//     first: FirstRoute,
//     second: SecondRoute,
//   });

//   render() {
//     return (
//       <TabView
//         navigationState={this.state}
//         renderScene={this._renderScene}
//         renderTabBar={this._renderTabBar}
//         onIndexChange={this._handleIndexChange}
//       />
//     );
//   }
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   tabBar: {
//     flexDirection: 'row',
//     // paddingTop: Constants.statusBarHeight,
//     paddingTop:20,
//   },
//   tabItem: {
//     flex: 1,
//     alignItems: 'center',
//     padding: 16,
//   },
// });
