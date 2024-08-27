import "@expo/metro-runtime";
import { registerRootComponent } from "expo";
import { View } from "react-native";
import Rheostat from "./Rheostat";
import algorithm from "./algorithms";

export default function App() {
	const minVal = 0;
	const maxVal = 1000;
	const range = [
		minVal,
		50,
		100,
		150,
		200,
		250,
		300,
		350,
		400,
		450,
		500,
		550,
		600,
		650,
		700,
		750,
		800,
		850,
		900,
		950,
		maxVal,
	];

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
				rheostatHeight={400}
				rheostatWidth={200}
				handleSize={24}
				shouldSnap={true}
				snappingPoints={range}
				algorithm={algorithm.linear}
				pitPointType="bars"
			/>
		</View>
	);
}

registerRootComponent(App);
