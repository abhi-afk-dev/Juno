
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  History: undefined;
  home: { conversation_Name: string };
};

export type HistoryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'History'
>;
