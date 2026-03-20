import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ModalPortal } from 'react-native-modals';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import configureStore from './src/Store';

// Auth Screens
import TermsScreen from './src/components/auth/terms';
import SignInScreen from './src/components/auth/Signln';
import RegisterScreen from './src/components/auth/Register';
import ForgetPasswordScreen from './src/components/auth/ForgetPass';
import AuthLoadingScreen from './src/components/auth/AuthLoading';
import LoadingScreen from './src/components/auth/Loading';

// Menu Screens
import HomeScreen from './src/components/screnns/home';
import DeviceScreen from './src/components/menu/device';
import ProductScreen from './src/components/menu/product';
import DailyDataScreen from './src/components/menu/dailydata';
import PressureMapScreen from './src/components/menu/pressuremap';
import GailAnalysisScreen from './src/components/menu/gail';
import TrainingScreen from './src/components/menu/training';
import ExerciseTraining from './src/components/menu/training/ExerciseTraining';
import ExerciseWorkOutScreen from './src/components/menu/training/ExerciseWorkOut';
import LowRiskExercise from './src/components/menu/training/LowRiskExercise';
import ModerateRiskExercise from './src/components/menu/training/ModerateRiskExercise';
import DashboardScreen from './src/components/menu/dashboard';
import ProfileScreen from './src/components/menu/profile';
import FootsBalanceScreen from './src/components/menu/balance';
import LeftFootsScreen from './src/components/menu/balance/left';
import RightFootsScreen from './src/components/menu/balance/right';
import FallRiskScreen from './src/components/menu/assessment/FallRiskScreen';
import StandEyes from './src/components/menu/assessment/StandEyes';

import TenMeterWalkTest from './src/components/menu/assessment/TenMeterWalkTest';
import Chatbot from './src/components/menu/chat/Chatbot';
import ShoeRecommendScreen from './src/components/menu/shoe/ShoeRecommendScreen';
import CartScreen from './src/components/menu/shoe/CartScreen';
import OrdersScreen from './src/components/menu/orders/OrdersScreen';

// Eight-Sensor Screens
import PressureMapEightSensorScreen from './src/components/eight/pressuremap';
import GailAnalysisEightSensorScreen from './src/components/eight/gail';
import TrainingEightSensorScreen from './src/components/eight/training';
import FootsBalanceEightSensorScreen from './src/components/eight/balance/index';
import LeftFootsEightSensorScreen from './src/components/eight/balance/left';
import RightFootsEightSensorScreen from './src/components/eight/balance/right';
import DashboardEightSensorScreen from './src/components/eight/dashboard';

// Other Screens
import Footscreen from './src/components/screnns/Foot/Footscreen';
import Tryf from './src/components/screnns/Try/Tryf';
import Legs from './src/components/screnns/Try/Legs';
import MonofilamentNew from './src/components/screnns/Try/MonofilamentNew';
import PatientList from './src/components/screnns/Try/PatientList';
import MedicalNotes from './src/components/menu/medical_notes/index';

// FAB Component
import DraggableFAB from './src/components/common/DraggableFAB';

const { store, persister } = configureStore();

const Stack = createStackNavigator();

// 1. HOC to inject FAB
const withFAB = (ScreenComponent) => {
    return (props) => (
        <View style={styles.screenContainer}>
            <ScreenComponent {...props} />
            <DraggableFAB navigation={props.navigation} />
        </View>
    );
};

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
    },
});

// 2. Auth Stack
const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgetPass" component={ForgetPasswordScreen} />
    </Stack.Navigator>
);

// 3. App Stack
const AppStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Home">
        <Stack.Screen name="Home" component={withFAB(HomeScreen)} />
        <Stack.Screen name="Footscreen" component={withFAB(Footscreen)} />
        <Stack.Screen name="Device" component={withFAB(DeviceScreen)} />
        <Stack.Screen name="Product" component={withFAB(ProductScreen)} />
        <Stack.Screen name="DailyData" component={withFAB(DailyDataScreen)} />
        <Stack.Screen name="PressureMap" component={withFAB(PressureMapScreen)} />
        <Stack.Screen name="GailAnalysis" component={withFAB(GailAnalysisScreen)} />
        <Stack.Screen name="Training" component={withFAB(TrainingScreen)} />
        <Stack.Screen name="ExerciseTraining" component={withFAB(ExerciseTraining)} />
        <Stack.Screen name="ExerciseWorkOut" component={withFAB(ExerciseWorkOutScreen)} />
        <Stack.Screen name="LowRiskExercise" component={withFAB(LowRiskExercise)} />
        <Stack.Screen name="ModerateRiskExercise" component={withFAB(ModerateRiskExercise)} />
        <Stack.Screen name="FallRiskScreen" component={withFAB(FallRiskScreen)} />
        <Stack.Screen name="StandOpenEyes">
            {(props) => <StandEyes {...props} type="open" />}
        </Stack.Screen>
        <Stack.Screen name="StandEyesClosed">
            {(props) => <StandEyes {...props} type="closed" />}
        </Stack.Screen>
        <Stack.Screen name="TenMeterWalkTest" component={withFAB(TenMeterWalkTest)} />
        <Stack.Screen name="Dashboard" component={withFAB(DashboardScreen)} />
        <Stack.Screen name="ShoeRecommend" component={withFAB(ShoeRecommendScreen)} />
        <Stack.Screen name="CartScreen" component={withFAB(CartScreen)} />
        <Stack.Screen name="OrdersScreen" component={withFAB(OrdersScreen)} />
        <Stack.Screen name="Profile" component={withFAB(ProfileScreen)} />
        <Stack.Screen name="MedicalNotes">
            {(props) => {
                const token = useSelector(state => state?.token);
                const user = useSelector(state => state?.user);
                const lang = useSelector(state => state?.lang);
                return <MedicalNotes {...props} token={token} user={user} lang={lang} />;
            }}
        </Stack.Screen>
        <Stack.Screen name="FootsBalance" component={withFAB(FootsBalanceScreen)} />
        <Stack.Screen name="Try" component={withFAB(Tryf)} />
        <Stack.Screen name="MonofilamentNew" component={withFAB(MonofilamentNew)} />
        <Stack.Screen name="Legs" component={withFAB(Legs)} />
        <Stack.Screen name="LeftFoots" component={withFAB(LeftFootsScreen)} />
        <Stack.Screen name="RigthFoots" component={withFAB(RightFootsScreen)} />
        <Stack.Screen name="PressureMapEight" component={withFAB(PressureMapEightSensorScreen)} />
        <Stack.Screen name="GailAnalysisEight" component={withFAB(GailAnalysisEightSensorScreen)} />
        <Stack.Screen name="TrainingEight" component={withFAB(TrainingEightSensorScreen)} />
        <Stack.Screen name="FootsBalanceEight" component={withFAB(FootsBalanceEightSensorScreen)} />
        <Stack.Screen name="LeftFootsEight" component={withFAB(LeftFootsEightSensorScreen)} />
        <Stack.Screen name="RigthFootsEight" component={withFAB(RightFootsEightSensorScreen)} />
        <Stack.Screen name="DashboardEight" component={withFAB(DashboardEightSensorScreen)} />
        <Stack.Screen name="Chatbot" component={Chatbot} />
        <Stack.Screen name="PatientList" component={PatientList} />
    </Stack.Navigator>
);

// 4. Root Navigation
export default () => (
    <Provider store={store}>
        <PersistGate persistor={persister} loading={null}>
            <NavigationContainer>
                <ModalPortal />
                <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="AuthLoading">
                    <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
                    <Stack.Screen name="Auth" component={AuthStack} />
                    <Stack.Screen name="App" component={AppStack} />
                    <Stack.Screen name="Loading" component={LoadingScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </PersistGate>
    </Provider>
);