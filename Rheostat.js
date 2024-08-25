import "react-native-gesture-handler";
import React, { useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	runOnJS,
	useDerivedValue,
	useAnimatedProps,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

function App() {
	// Circle 1 - Top
	const pressedTop = useSharedValue(false);
	const offsetTop = useSharedValue(0);
	const lastOffsetTop = useSharedValue(0);
	const filledPercentageTop = useSharedValue(0);

	// Circle 2 - Bottom
	const pressedBottom = useSharedValue(false);
	const offsetBottom = useSharedValue(0);
	const lastOffsetBottom = useSharedValue(0);
	const filledPercentageBottom = useSharedValue(0);

	const [offsetTopValue, setOffsetTopValue] = useState(0);
	const [offsetBottomValue, setOffsetBottomValue] = useState(0);
	const [snappingPoints, setSnappingPoints] = useState([0, 10, 15, 70, 100]);

	const circleSize = 50;

	const RheostatHeight = 600;
	const RheostatWidth = 200;
	const LineWidth = 4;
	const hasDoubleHandle = true;
	const shouldSnap = true;

	useDerivedValue(() => {
		runOnJS(setOffsetTopValue)(offsetTop.value);
	}, [offsetTopValue]);

	useDerivedValue(() => {
		runOnJS(setOffsetBottomValue)(offsetBottom.value);
	}, [offsetBottomValue]);

	const getGesturePan = (panType = "bottom") => {
		const offset = panType === "bottom" ? offsetBottom : offsetTop;
		const lastOffset = panType === "bottom" ? lastOffsetBottom : lastOffsetTop;
		const button = panType === "bottom" ? pressedBottom : pressedTop;

		return Gesture.Pan()
			.onBegin(() => {
				button.value = true;
			})
			.onChange((event) => {
				offset.value = lastOffset.value + event.translationY;

				if (panType === "bottom") {
					offset.value = Math.max(-(RheostatHeight - circleSize), offset.value);
					offset.value = Math.min(0, offset.value);
				} else {
					offset.value = Math.max(0, offset.value);
					offset.value = Math.min(RheostatHeight - circleSize, offset.value);
				}

				function jslog(...args) {
					console.log(JSON.stringify(args, null, 4));
				}

				if (shouldSnap) {
					const binarySearch = (arr, target) => {
						let left = 0;
						let right = arr.length - 1;
						let answer = -1;

						while (left <= right) {
							const mid = Math.floor((left + right) / 2);

							if (arr[mid] === target) {
								return mid;
							}

							if (arr[mid] < target) {
								left = mid + 1;
							} else {
								right = mid - 1;
							}
						}

						return answer;
					};

					const getClosestValue = (arr, target, leftIndex, rightIndex) => {
						let left = leftIndex || 0;
						let right = rightIndex || arr.length - 1;
						let closestIndex = -1;

						while (left <= right) {
							const mid = Math.floor((left + right) / 2);

							if (arr[mid] === target) {
								return mid;
							}

							if (
								closestIndex === -1 ||
								Math.abs(arr[mid] - target) < Math.abs(arr[closestIndex] - target)
							) {
								closestIndex = mid;
							}

							if (arr[mid] < target) {
								left = mid + 1;
							} else {
								right = mid - 1;
							}
						}

						return closestIndex;
					};

					const getFilledPercentage = (offset, type) => {
						const percentHeight = RheostatHeight - circleSize;
						const multiplier = type === "bottom" ? -1 : 1;
						return multiplier * (offset.value / percentHeight) * 100;
					};

					const filledPercentageBottom = getFilledPercentage(offsetBottom, "bottom");
					const filledPercentageTop = getFilledPercentage(offsetTop, "top");

					if (panType === "bottom") {
						const topIndex = binarySearch(snappingPoints, filledPercentageTop);

						const closestBottomIndex = getClosestValue(
							snappingPoints,
							100 - filledPercentageBottom,
							topIndex + 1,
							snappingPoints.length - 1
						);

						const closestSnappingPercentage = snappingPoints[closestBottomIndex];
						const rheostatSize = RheostatHeight - circleSize;
						const snapValue =
							rheostatSize - (closestSnappingPercentage / 100) * rheostatSize;
						offsetBottom.value = -snapValue;
					} else {
						const bottomIndex = binarySearch(
							snappingPoints,
							100 - filledPercentageBottom
						);

						const closestTopIndex = getClosestValue(
							snappingPoints,
							filledPercentageTop,
							0,
							bottomIndex - 1
						);

						const closestSnappingPercentage = snappingPoints[closestTopIndex];
						const snapValue =
							(closestSnappingPercentage / 100) * (RheostatHeight - circleSize);
						offsetTop.value = snapValue;
					}
				}
			})
			.onFinalize(() => {
				button.value = false;
				lastOffset.value = offset.value;
			});
	};

	const animatedStylesTop = useAnimatedStyle(() => ({
		transform: [{ translateY: offsetTop.value }],
		backgroundColor: pressedTop.value ? "#FFE04B" : "#b58df1",
	}));

	const animatedStylesBottom = useAnimatedStyle(() => ({
		transform: [{ translateY: offsetBottom.value }],
		backgroundColor: pressedBottom.value ? "#FFA07A" : "#87CEFA",
	}));

	const filledBar = useAnimatedStyle(() => {
		return {
			width: 10,
			backgroundColor: "green",
			position: "absolute",
			height: RheostatHeight - circleSize - offsetTop.value + offsetBottom.value,
			left: (RheostatWidth / 2) - LineWidth,
			top: offsetTop.value + 25,
		};
	});

	const panTop = getGesturePan("top");
	const panBottom = getGesturePan("bottom");

	return (
		<GestureHandlerRootView
			style={{
				width: "100%",
				height: "100%",
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<View
				style={{
					width: RheostatWidth,
					height: RheostatHeight,
					borderWidth: 1,
					borderStyle: "solid",
					borderColor: "black",
					overflow: "hidden",
				}}
			>
				<View
					style={{
						width: LineWidth,
						height: RheostatHeight - circleSize,
						backgroundColor: "red",
						position: "absolute",
						left: RheostatWidth / 2 - LineWidth / 2,
						top: circleSize / 2,
					}}
				>
					{snappingPoints.map((point, index) => (
						<View
							key={index}
							style={{
								width: 100,
								height: 5,
								backgroundColor: "green",
								position: "absolute",
								top: `${point}%`,
								left: "0%",
							}}
						/>
					))}
				</View>

				{/* filled bar */}
				<Animated.View style={filledBar}></Animated.View>

				<View
					style={{
						alignSelf: "center",
						height: RheostatHeight,
					}}
				>
					{/* top pan */}
					{hasDoubleHandle && (
						<GestureDetector gesture={panTop}>
							<Animated.View
								style={[
									{
										backgroundColor: "#b58df1",
										width: circleSize,
										height: circleSize,
										alignItems: "center",
										justifyContent: "center",
										opacity: 0.8,
										borderRadius: 50,
										top: 0,
									},
									animatedStylesTop,
								]}
							>
								<Text>
									{(offsetTopValue / (RheostatHeight - circleSize)) // TODO:circlesize is not correct
										.toFixed(2)}
								</Text>
							</Animated.View>
						</GestureDetector>
					)}

					{/* bottom pan */}
					<GestureDetector gesture={panBottom}>
						<Animated.View
							style={[
								{
									backgroundColor: "#87CEFA",
									width: circleSize,
									height: circleSize,
									alignItems: "center",
									justifyContent: "center",
									opacity: 0.8,
									borderRadius: 50,
									top:
										RheostatHeight -
										circleSize -
										(hasDoubleHandle ? circleSize : 0),
								},
								animatedStylesBottom,
							]}
						>
							<Text>{offsetBottomValue.toFixed(2)}</Text>
						</Animated.View>
					</GestureDetector>
				</View>
			</View>
		</GestureHandlerRootView>
	);
}

export default App;
