import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	runOnJS,
	runOnUI,
	useDerivedValue,
	useAnimatedProps,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

function jslog(...args) {
	console.log(JSON.stringify(args, null, 4));
}

const normalizeRange = (value, minimum, maximum) => {
	return (value - minimum) / (maximum - minimum);
};

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

function Rheostat({
	minRange = 0,
	maxRange = 1000,

	initialTopValue = 0,
	initialBottomValue = 100,

	shouldSnap = true,
	snappingPoints = [0, 100],

	rheostatHeight = 600,
	rheostatWidth = 200,

	handleSize = 20,
}) {
	const rheostatSize = rheostatHeight - handleSize;
	const valueTopPercentage = initialTopValue / maxRange;
	const valueBottomPercentage = initialBottomValue / maxRange;
	const initalValueTop = valueTopPercentage * rheostatSize;
	const initalValueBottom = rheostatSize - valueBottomPercentage * rheostatSize;

	// // Circle 1 - Top
	const offsetTop = useSharedValue(initalValueTop);
	const lastOffsetTop = useSharedValue(initalValueTop);

	// // Circle 2 - Bottom
	const offsetBottom = useSharedValue(-initalValueBottom);
	const lastOffsetBottom = useSharedValue(-initalValueBottom);

	const snappingPercentagePoints = snappingPoints.map((point) => {
		return normalizeRange(point, minRange, maxRange) * 100;
	});

	const getFilledPercentageTop = () => {
		const percentHeight = rheostatHeight - handleSize;
		const filledPercent = (offsetTop.value / percentHeight) * 100;

		if (shouldSnap) {
			const closestTopIndex = getClosestValue(snappingPercentagePoints, filledPercent);
			const value = snappingPercentagePoints[closestTopIndex];
			return value;
		}

		return filledPercent;
	};

	const getFilledPercentageBottom = () => {
		const percentHeight = rheostatHeight - handleSize;
		const filledPercent = ((-1 * offsetBottom.value) / percentHeight) * 100;

		if (shouldSnap) {
			const closestBottomIndex = getClosestValue(
				snappingPercentagePoints,
				100 - filledPercent
			);
			const value = snappingPercentagePoints[closestBottomIndex];
			return value;
		}

		return filledPercent;
	};

	const LineWidth = 4;
	const hasDoubleHandle = true;

	// useDerivedValue(() => {
	// 	runOnJS(setOffsetTopValue)(offsetTop.value);
	// }, [offsetTopValue]);

	// useDerivedValue(() => {
	// 	runOnJS(setOffsetBottomValue)(offsetBottom.value);
	// }, [offsetBottomValue]);

	const getGesturePan = (panType = "bottom") => {
		const offset = panType === "bottom" ? offsetBottom : offsetTop;
		const lastOffset = panType === "bottom" ? lastOffsetBottom : lastOffsetTop;

		return Gesture.Pan()
			.onBegin(() => {
				jslog({
					initalValueBottom,
					initalValueTop,
				});
			})
			.onChange((event) => {
				offset.value = lastOffset.value + event.translationY;

				const filledPercentageTop = getFilledPercentageTop();
				const filledPercentageBottom = getFilledPercentageBottom();

				if (panType === "bottom") {
					offset.value = Math.max(-(rheostatHeight - handleSize), offset.value);
					offset.value = Math.min(0, offset.value);
				} else {
					offset.value = Math.max(0, offset.value);
					offset.value = Math.min(rheostatHeight - handleSize, offset.value);
				}

				if (shouldSnap) {
					if (panType === "bottom") {
						const topIndex = binarySearch(
							snappingPercentagePoints,
							filledPercentageTop
						);

						const closestBottomIndex = getClosestValue(
							snappingPercentagePoints,
							filledPercentageBottom,
							topIndex + 1,
							snappingPercentagePoints.length - 1
						);
						const closestSnappingPercentage =
							snappingPercentagePoints[closestBottomIndex];
						const rheostatSize = rheostatHeight - handleSize;
						const snapValue =
							rheostatSize - (closestSnappingPercentage / 100) * rheostatSize;
						offsetBottom.value = -snapValue;
					} else {
						const bottomIndex = binarySearch(
							snappingPercentagePoints,
							filledPercentageBottom
						);

						const closestTopIndex = getClosestValue(
							snappingPercentagePoints,
							filledPercentageTop,
							0,
							bottomIndex
						);

						const closestPercentage = snappingPercentagePoints[closestTopIndex];
						const snapValue = (closestPercentage / 100) * (rheostatHeight - handleSize);
						offsetTop.value = snapValue;
					}
				}
			})
			.onFinalize(() => {
				lastOffset.value = offset.value;
			})
			.runOnJS(true);
	};

	const animatedStylesTop = useAnimatedStyle(() => ({
		transform: [{ translateY: offsetTop.value }],
		backgroundColor: "#b58df1",
	}));

	const animatedStylesBottom = useAnimatedStyle(() => ({
		transform: [{ translateY: offsetBottom.value }],
		backgroundColor: "#87CEFA",
	}));

	const filledBar = useAnimatedStyle(() => {
		return {
			width: 10,
			backgroundColor: "green",
			position: "absolute",
			height: rheostatHeight - handleSize - offsetTop.value + offsetBottom.value,
			left: rheostatWidth / 2 - LineWidth,
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
					width: rheostatWidth,
					height: rheostatHeight,
					borderWidth: 1,
					borderStyle: "solid",
					borderColor: "black",
					overflow: "hidden",
				}}
			>
				<View
					style={{
						width: LineWidth,
						height: rheostatHeight - handleSize,
						backgroundColor: "#b5b5b5",
						position: "absolute",
						left: rheostatWidth / 2 - LineWidth / 2,
						top: handleSize / 2,
					}}
				>
					{snappingPercentagePoints.map((point, index) => (
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
						height: rheostatHeight,
					}}
				>
					{/* top pan */}
					{hasDoubleHandle && (
						<GestureDetector gesture={panTop}>
							<Animated.View
								style={[
									{
										backgroundColor: "#b58df1",
										width: handleSize,
										height: handleSize,
										alignItems: "center",
										justifyContent: "center",
										opacity: 0.8,
										borderRadius: 50,
										top: 0,
									},
									animatedStylesTop,
								]}
							>
								{/* <Text>
									{transformer(
										(offsetTopValue / (rheostatHeight - handleSize)) * 100
									)}
								</Text> */}
							</Animated.View>
						</GestureDetector>
					)}

					{/* bottom pan */}
					<GestureDetector gesture={panBottom}>
						<Animated.View
							style={[
								{
									backgroundColor: "#87CEFA",
									width: handleSize,
									height: handleSize,
									alignItems: "center",
									justifyContent: "center",
									opacity: 0.8,
									borderRadius: 50,
									top:
										rheostatHeight -
										handleSize -
										(hasDoubleHandle ? handleSize : 0),
								},
								animatedStylesBottom,
							]}
						>
							{/* <Text>
								{(-1 * (offsetBottomValue / (rheostatHeight - handleSize)) * 100) // TODO:circlesize is not correct
									.toFixed(2)}
							</Text> */}
						</Animated.View>
					</GestureDetector>
				</View>
			</View>
		</GestureHandlerRootView>
	);
}

export default Rheostat;
