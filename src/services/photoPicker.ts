import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Single entry point for meal photos. Today's composer used to open the
// camera only and Chat's opened the library only — a meal you photographed
// an hour ago was unreachable from Today. Both now ask.
// Resolves to a local uri, or null when cancelled / permission denied.
export function pickMealPhoto(): Promise<string | null> {
  return new Promise(resolve => {
    Alert.alert('Add a meal photo', undefined, [
      { text: 'Take photo', onPress: () => resolve(takePhoto()) },
      { text: 'Choose from library', onPress: () => resolve(chooseFromLibrary()) },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

async function takePhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Camera off', 'Enable camera access in Settings to log meals from photos.');
    return null;
  }
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.6,
  });
  return res.canceled || !res.assets[0] ? null : res.assets[0].uri;
}

async function chooseFromLibrary(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.6,
  });
  return res.canceled || !res.assets[0] ? null : res.assets[0].uri;
}
