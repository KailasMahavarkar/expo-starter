import "@expo/metro-runtime";
import { registerRootComponent } from "expo";
import { View } from "react-native";
import Rheostat from "./Rheostat";

export default function App() {
	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<Rheostat />
		</View>
	);
}

registerRootComponent(App);
