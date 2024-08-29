import "@expo/metro-runtime";
import { registerRootComponent } from "expo";
import { Button, Pressable, View, Text } from "react-native";
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
		// 150,
		200,
		// 250,
		300,
		// 350,
		400,
		// 425,
		// 450,
		// 500,
		// 550,
		// 600,
		// 650,
		// 700,
		// 750,
		800,
		// 850,
		// 900,
		// 950,
		// maxVal,
	];

	const [topValue, setTopValue] = useState(minVal);
	const [bottomValue, setBottomValue] = useState(maxVal);
	const [flipped, setFlipped] = useState(false);
	const [update, setUpdate] = useState(false);

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
					handleSize={30}
                    handleDelta={5}
					shouldSnap={false}
					snappingPoints={range}
					algorithm={algorithm.linear}
					showSnapBars={true}
					flipped={false}
                    update={update}
				/>
				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-around",
					}}
				>
					<Pressable
						style={{
							alignItems: "center",
							justifyContent: "center",
							backgroundColor: "pink",
							padding: 5,
						}}
						onPress={() => {
							if (!update) {
								setTopValue(200);
								setBottomValue(300);
							} else {
								setTopValue(minVal);
								setBottomValue(maxVal);
							}

                            setUpdate(!update);
						}}
					>
						<View>
							<Text>Update Values</Text>
						</View>
					</Pressable>

					<Pressable
						style={{
							alignItems: "center",
							justifyContent: "center",
							backgroundColor: "pink",
							padding: 5,
						}}
						onPress={() => {
							setFlipped(!flipped);
						}}
					>
						<View>
							<Text>{flipped ? "Flipped" : "Not Flipped"}</Text>
						</View>
					</Pressable>
				</View>
			</View>
		</View>
	);
}

registerRootComponent(App);
