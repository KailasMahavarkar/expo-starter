import "@expo/metro-runtime";
import { registerRootComponent } from "expo";
import { View } from "react-native";
import Rheostat from "./Rheostat";

export default function App() {
	const minRange = 0;
	const maxRange = 800;

	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<Rheostat
				initialTopValue={200}
				initialBottomValue={maxRange}
				minRange={minRange}
				maxRange={maxRange}
				snappingPoints={[minRange, 50, 100, 200, 400, maxRange]}
				handleSize={50}
				rheostatHeight={600}
				rheostatWidth={200}
				shouldSnap={false}
				transformer={(value) => {
					// make a exponential scale
					return Math.pow(2, value / 10).toFixed(2);
				}}
				values={[0, 100]}
			/>
		</View>
	);
}

registerRootComponent(App);
