import "@expo/metro-runtime";
import { registerRootComponent } from "expo";
import { View } from "react-native";
import Rheostat from "./Rheostat";

const quadraticAlgorithm = {
	getValue: (position, minRange, maxRange) => {
		const normalizedPosition = position / 100;
		return minRange + Math.pow(normalizedPosition, 2) * (maxRange - minRange);
	},
	getPosition: (value, minRange, maxRange) => {
		const normalizedValue = (value - minRange) / (maxRange - minRange);
		return Math.sqrt(normalizedValue) * 100;
	},
};

export default function App() {
	const minRange = 0;
	const maxRange = 800;

	const algorithm = {
		linear: {
			getValue: (position, minRange, maxRange) => {
				return minRange + (position / 100) * (maxRange - minRange);
			},
			getPosition: (value, minRange, maxRange) => {
				return ((value - minRange) / (maxRange - minRange)) * 100;
			},
		},
		quadratic: quadraticAlgorithm,
	};

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
				minRange={0}
				maxRange={1000}
				initialTopValue={0}
				initialBottomValue={750}
				rheostatHeight={600}
				rheostatWidth={200}
				handleSize={50}
				shouldSnap={false}
				snappingPoints={[0, 250, 500, 750, 1000]}
				algorithm={quadraticAlgorithm}
			/>
		</View>
	);
}

registerRootComponent(App);
