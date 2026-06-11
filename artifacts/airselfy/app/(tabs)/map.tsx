import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NativeMap from "@/components/NativeMap";
import { useColors } from "@/hooks/useColors";

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: topPad }}>
      <NativeMap />
    </View>
  );
}
