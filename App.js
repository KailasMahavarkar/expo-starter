import "@expo/metro-runtime";
import { registerRootComponent } from "expo";
import { View } from "react-native";
import Rheostat from "./Rheostat";
import algorithm from "./algorithms";

export default function App() {
	const minVal = 0;
	const maxVal = 1000;
	const range = [minVal, 30, 100, 400, 800, maxVal];

	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
				backgroundColor: "black",
				borderWidth: 1,
				borderColor: "white",
			}}
		>
			<Rheostat
				minRange={minVal}
				maxRange={maxVal}
				initialTopValue={minVal}
				initialBottomValue={maxVal}
				rheostatHeight={600}
				rheostatWidth={200}
				handleSize={50}
				shouldSnap={true}
				snappingPoints={range}
				algorithm={algorithm.log10}
			/>
		</View>
	);
}

registerRootComponent(App);
