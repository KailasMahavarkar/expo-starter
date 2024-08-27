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

	if (leftIndex > rightIndex) {
		return -1;
	}

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

	algorithm = {
		getValue: (position, minRange, maxRange) => {
			return minRange + (position / 100) * (maxRange - minRange);
		},
		getPosition: (value, minRange, maxRange) => {
			return ((value - minRange) / (maxRange - minRange)) * 100;
		},
	},

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

	const snappingPointLength = snappingPoints.length - 1;

	const LineWidth = 4;
	const hasDoubleHandle = true;

	function getClosestIndex(snappingPoints, target, leftIndex, rightIndex) {
		let left = leftIndex || 0;
		let right = rightIndex || snappingPointLength;

		while (left <= right) {
			let mid = Math.floor((left + right) / 2);

			if (snappingPoints[mid] === target) {
				return mid;
			} else if (snappingPoints[mid] < target) {
				left = mid + 1;
			} else {
				right = mid - 1;
			}
		}

		// If the target is not found, find the closest index
		let closestIndex =
			Math.abs(snappingPoints[left] - target) < Math.abs(snappingPoints[right] - target)
				? left
				: right;
		return closestIndex;
	}

	function getIndexLessThanTarget(snappingPoints, target) {
		let left = 0;
		let right = snappingPointLength;

		while (left <= right) {
			let mid = Math.floor((left + right) / 2);

			if (snappingPoints[mid] >= target) {
				right = mid - 1;
			} else {
				left = mid + 1;
			}
		}

		return right >= 0 ? right : left;
	}

	function getIndexMoreThanTarget(snappingPoints, target) {
		let left = 0;
		let right = snappingPoints.length - 1;

		while (left <= right) {
			let mid = Math.floor((left + right) / 2);

			if (snappingPoints[mid] <= target) {
				left = mid + 1;
			} else {
				right = mid - 1;
			}
		}

		return left;
	}

	const getGesturePan = (panType) => {
		const offset = panType === "bottom" ? offsetBottom : offsetTop;
		const lastOffset = panType === "bottom" ? lastOffsetBottom : lastOffsetTop;

		return Gesture.Pan()
			.onBegin(() => {})
			.onChange((event) => {
				// Calculate new offset value using drag event
				offset.value = lastOffset.value + event.translationY;

				// Apply bounds for the slider handles
				if (panType === "bottom") {
					offset.value = Math.max(-(rheostatHeight - handleSize), offset.value);
					offset.value = Math.min(0, offset.value);
				} else {
					offset.value = Math.max(0, offset.value);
					offset.value = Math.min(rheostatHeight - handleSize, offset.value);
				}

				// Calculate the handle percentages
				let handlePercentageTop = (offsetTop.value / rheostatSize) * 100;
				let handlePercentageBottom = 100 - ((-1 * offsetBottom.value) / rheostatSize) * 100;

				// Adjust handle percentages for non-linear scale
				const handleValueTop = algorithm.getValue(handlePercentageTop, minRange, maxRange);
				const handleValueBottom = algorithm.getValue(
					handlePercentageBottom,
					minRange,
					maxRange
				);

				// Convert the snapped values back to slider positions
				let handlePositionTop = algorithm.getPosition(handleValueTop, minRange, maxRange);
				let handlePositionBottom = algorithm.getPosition(
					handleValueBottom,
					minRange,
					maxRange
				);

				// Snapping logic only if snapping is enabled
				if (shouldSnap) {
					const closestSnappingIndexTop = getClosestIndex(
						snappingPercentagePoints,
						handlePositionTop
					);
					const closestSnappingIndexBottom = getClosestIndex(
						snappingPercentagePoints,
						handlePositionBottom
					);

					if (panType === "top") {
						// Handle snapping for the top handle
						const lessTargetIndex = getIndexLessThanTarget(
							snappingPercentagePoints,
							handlePositionBottom
						);

						const newMaxTopPercentage = snappingPercentagePoints[lessTargetIndex];

						// Find the closest snapping value using the algorithm's value computation
						const snappedValue = algorithm.getValue(
							snappingPercentagePoints[closestSnappingIndexTop],
							minRange,
							maxRange
						);

						// Find the exact slider position using the algorithm's position computation
						const snappedPercentage = algorithm.getPosition(
							snappedValue,
							minRange,
							maxRange
						);

						offsetTop.value = snappedPercentage * (rheostatSize / 100);

						// Ensure the new top offset does not exceed the bottom handle's maximum value
						offsetTop.value = Math.min(
							offsetTop.value,
							newMaxTopPercentage * (rheostatSize / 100)
						);

						jslog({
							snappedValue,
							snappedPercentage,
						});
					} else {
						// Handle snapping for the bottom handle
						const moreTargetIndex = getIndexMoreThanTarget(
							snappingPercentagePoints,
							handlePositionTop
						);

						const newMinBottomPercentage =
							100 - snappingPercentagePoints[moreTargetIndex];
						const newMinBottomValue = newMinBottomPercentage * (rheostatSize / 100);

						// Calculate the snapped value and position for the bottom handle
						const snappedValue = algorithm.getValue(
							snappingPercentagePoints[closestSnappingIndexBottom],
							minRange,
							maxRange
						);

						const snappedPercentage = algorithm.getPosition(
							snappedValue,
							minRange,
							maxRange
						);

						jslog({
							snappedValue,
							snappedPercentage,
						});

						offsetBottom.value = -(
							rheostatSize -
							snappedPercentage * (rheostatSize / 100)
						);

						// Ensure the new bottom offset does not go below the top handle's minimum value
						offsetBottom.value = Math.max(-newMinBottomValue, offsetBottom.value);
					}
				} else {
					// offsetTop.value = Math.min(offsetTop.value, offsetBottom.value - handleSize);
					// offsetBottom.value = Math.max(offsetBottom.value, offsetTop.value + handleSize);
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
					borderWidth: 1,
					borderColor: "white",
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
						>
							<Text
								style={{
									color: "white",
									textAlign: "center",
								}}
							>
								{point} | {index} | {snappingPoints[index]}
							</Text>
						</View>
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
