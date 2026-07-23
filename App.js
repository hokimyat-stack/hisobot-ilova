// App.js — Kunlik Ish Hisoboti mobil ilovasi v3
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import NewReportScreen from './src/screens/NewReportScreen';
import StageScreen from './src/screens/StageScreen';
import CameraScreen from './src/screens/CameraScreen';
import MyReportsScreen from './src/screens/MyReportsScreen';
import PasswordChangeScreen from './src/screens/PasswordChangeScreen';
import { avtoSyncYoq } from './src/queue';
import { pushTokenSaqla } from './src/api';
import { RANG } from './src/config';

// Expo Go'da push cheklangan (SDK 53+) — faqat haqiqiy APK'da to'liq ishlaydi
const ExpoGo = Constants.appOwnership === 'expo';
const Notifications = ExpoGo ? null : require('expo-notifications');

const Stack = createNativeStackNavigator();

if (Notifications) Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false })
});

async function eslatmaOrnat() {
  if (!Notifications) return;
  await Notifications.requestPermissionsAsync();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Kunlik hisobot', body: "Bugungi ish holatini yuklashni unutmang!" },
    trigger: { hour: 17, minute: 0, repeats: true }
  });
}

// Push token — Expo'ning bepul push xizmatiga ro'yxatdan o'tish, serverga yuborish
async function pushTokenRoyxatOl(xodimId) {
  if (!Notifications || !xodimId) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    let ruxsat = status;
    if (status !== 'granted') {
      const r = await Notifications.requestPermissionsAsync();
      ruxsat = r.status;
    }
    if (ruxsat !== 'granted') return;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    if (tokenData?.data) await pushTokenSaqla(xodimId, tokenData.data);
  } catch (e) { /* push ixtiyoriy — xato bo'lsa ilova ishlayveradi */ }
}

export default function App() {
  const [tayyor, setTayyor] = useState(false);
  const [xodim, setXodim] = useState(null);

  useEffect(() => {
    (async () => {
      const saqlangan = await AsyncStorage.getItem('XODIM');
      if (saqlangan) {
        const x = JSON.parse(saqlangan);
        setXodim(x);
        pushTokenRoyxatOl(x.id);
      }
      setTayyor(true);
      eslatmaOrnat();
    })();
    const unsub = avtoSyncYoq();
    return unsub;
  }, []);

  if (!tayyor) return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: RANG.fon }}>
      <ActivityIndicator size="large" color={RANG.asosiy} />
    </View>
  );

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}
        initialRouteName={xodim ? 'Home' : 'Login'}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NewReport" component={NewReportScreen} />
        <Stack.Screen name="Stage" component={StageScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="MyReports" component={MyReportsScreen} />
        <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
