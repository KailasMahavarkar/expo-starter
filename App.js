import "@expo/metro-runtime";
import { registerRootComponent } from "expo";
import { Button, View } from "react-native";
import React, { useState } from "react";
import Rheostat from "./Rheostat";
import algorithm from "./algorithms";

export default function App() {
	const minVal = 0;
	const maxVal = 800;
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
		// 850,
		// 900,
		// 950,
		// maxVal,
	];

	const [topValue, setTopValue] = useState(minVal);
	const [bottomValue, setBottomValue] = useState(maxVal);

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
			<View>
				<Rheostat
					minRange={minVal}
					maxRange={maxVal}
					topValue={topValue}
					bottomValue={bottomValue}
					rheostatHeight={600}
					rheostatWidth={200}
					handleSize={50}
					shouldSnap={true}
					snappingPoints={range}
					algorithm={algorithm.linear}
					showSnapBars={true}
				/>
				<View>
					<Button
						onPress={() => {
							setTopValue(200);
							setBottomValue(600);
						}}
						title="Test"
					/>
				</View>
			</View>
		</View>
	);
}

registerRootComponent(App);
