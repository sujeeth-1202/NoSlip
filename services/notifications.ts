import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests notification permissions and returns the Expo Push Token.
 * Returns null gracefully on emulators or if permission is denied.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3E5C43',
      });
    }

    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('EAS Project ID not found in app config');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenData.data;
  } catch (error) {
    console.warn('Failed to get push token:', error);
    return null;
  }
}

/**
 * Sends a push notification directly to Expo's Push API endpoint.
 * No Cloud Functions needed — works client-side.
 */
export async function sendExpoPushNotification(
  targetPushToken: string,
  title: string = 'NoSlip',
  body: string = "Your tree's thirsty — check in today.",
  data: Record<string, any> = { targetPage: 0 },
): Promise<boolean> {
  if (!targetPushToken) return false;

  try {
    const message = {
      to: targetPushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    return result?.data?.status === 'ok';
  } catch (error) {
    console.warn('Failed to dispatch push notification:', error);
    return false;
  }
}
