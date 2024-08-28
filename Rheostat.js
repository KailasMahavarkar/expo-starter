import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, runOnJS } from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import algo from "./algorithms";

function jslog(...args) {
	console.log(JSON.stringify(args, null, 4));
}

function Rheostat({
	minRange = 0,
	maxRange = 1000,

	topValue = 0,
	bottomValue = 100,

	shouldSnap = true,
	snappingPoints = [0, 100],

	rheostatHeight = 600,
	rheostatWidth = 200,
	showSnapBars = false,

	algorithm = algo.linear,

	handleSize = 20,
}) {
	const rheostatSize = rheostatHeight - handleSize;
	const topPercentage = algorithm.getPosition(topValue, minRange, maxRange);
	const bottomPercentage = algorithm.getPosition(bottomValue, minRange, maxRange);
	const topOffset = topPercentage * (rheostatSize / 100);
	const bottomOffset = rheostatSize - bottomPercentage * (rheostatSize / 100);

	// re-animated states
	const animatedOffsetTop = useSharedValue(topOffset);
	const animatedLastOffsetTop = useSharedValue(topOffset);
	const animatedOffsetBottom = useSharedValue(-bottomOffset);
	const animatedLastOffsetBottom = useSharedValue(-bottomOffset);

	const [currentTopValue, setCurrentTopValue] = useState(topValue);
	const [currentBottomValue, setCurrentBottomValue] = useState(bottomValue);

	useEffect(() => {
		const percentage = algorithm.getPosition(topValue, 0, maxRange);
		const value = algorithm.getValue(percentage, minRange, maxRange);
		animatedOffsetTop.value = percentage * (rheostatSize / 100);
		animatedLastOffsetTop.value = percentage * (rheostatSize / 100);
		setCurrentTopValue(value);
	}, [topValue]);

	useEffect(() => {
		const percentage = algorithm.getPosition(bottomValue, 0, maxRange);
		const value = algorithm.getValue(percentage, minRange, maxRange);
		const percentageInverted = 100 - percentage;

		animatedOffsetBottom.value = -(percentageInverted * (rheostatSize / 100));
		animatedLastOffsetBottom.value = -(percentageInverted * (rheostatSize / 100));

		setCurrentBottomValue(value);
	}, [bottomValue]);

	const snappingPercentageAlgorithm = snappingPoints.map((point) => {
		const snapValue = Math.max(0, algorithm.getPosition(point, minRange, maxRange));
		return Number(snapValue.toFixed(2));
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
		const offset = panType === "bottom" ? animatedOffsetBottom : animatedOffsetTop;
		const lastOffset = panType === "bottom" ? animatedLastOffsetBottom : animatedLastOffsetTop;

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

				if (shouldSnap) {
					// Calculate the handle percentages
					let handlePercentageTop = (animatedOffsetTop.value / rheostatSize) * 100;
					let handlePercentageBottom =
						100 - ((-1 * animatedOffsetBottom.value) / rheostatSize) * 100;

					// Adjust handle percentages for non-linear scale
					const handleValueTop = algorithm.getValue(
						handlePercentageTop,
						minRange,
						maxRange
					);
					const handleValueBottom = algorithm.getValue(
						handlePercentageBottom,
						minRange,
						maxRange
					);

					// Convert the snapped values back to slider positions
					let handlePositionTop = algorithm.getPosition(
						handleValueTop,
						minRange,
						maxRange
					);
					let handlePositionBottom = algorithm.getPosition(
						handleValueBottom,
						minRange,
						maxRange
					);

					// Snapping logic only if snapping is enabled
					const closestSnappingIndexTop = getClosestIndex(
						snappingPercentageAlgorithm,
						handlePositionTop
					);
					const closestSnappingIndexBottom = getClosestIndex(
						snappingPercentageAlgorithm,
						handlePositionBottom
					);

					if (panType === "top") {
						// Handle snapping for the top handle
						const lessTargetIndex = getIndexLessThanTarget(
							snappingPercentageAlgorithm,
							handlePositionBottom
						);
						const newMaxTopPercentage = snappingPercentageAlgorithm[lessTargetIndex];
						// Find the closest snapping value using the algorithm's value computation
						const snappedValue = algorithm.getValue(
							snappingPercentageAlgorithm[closestSnappingIndexTop],
							minRange,
							maxRange
						);
						// Find the exact slider position using the algorithm's position computation
						const snappedPercentage = algorithm.getPosition(
							snappedValue,
							minRange,
							maxRange
						);
						animatedOffsetTop.value = snappedPercentage * (rheostatSize / 100);
						// Ensure the new top offset does not exceed the bottom handle's maximum value
						animatedOffsetTop.value = Math.min(
							animatedOffsetTop.value,
							newMaxTopPercentage * (rheostatSize / 100)
						);
						// convert animatedOffsetTop.value to percentage
						const snappedValuePercentage =
							(animatedOffsetTop.value / rheostatSize) * 100;
						// get value from percentage
						const snappedValueFromPercentage = algorithm.getValue(
							snappedValuePercentage,
							minRange,
							maxRange
						);
						runOnJS(setCurrentTopValue)(Math.round(snappedValueFromPercentage));
					} else {
						// Handle snapping for the bottom handle
						const moreTargetIndex = getIndexMoreThanTarget(
							snappingPercentageAlgorithm,
							handlePositionTop
						);
						const newMinBottomPercentage =
							100 - snappingPercentageAlgorithm[moreTargetIndex];
						const newMinBottomValue = newMinBottomPercentage * (rheostatSize / 100);
						// Calculate the snapped value and position for the bottom handle
						const snappedValue = algorithm.getValue(
							snappingPercentageAlgorithm[closestSnappingIndexBottom],
							minRange,
							maxRange
						);
						const snappedPercentage = algorithm.getPosition(
							snappedValue,
							minRange,
							maxRange
						);
						animatedOffsetBottom.value = -(
							rheostatSize -
							snappedPercentage * (rheostatSize / 100)
						);
						animatedOffsetBottom.value = Math.max(
							-newMinBottomValue,
							animatedOffsetBottom.value
						);
						// convert animatedOffsetBottom.value to percentage
						const snappedValuePercentage =
							100 - ((-1 * animatedOffsetBottom.value) / rheostatSize) * 100;
						// get value from percentage
						const snappedValueFromPercentage = algorithm.getValue(
							snappedValuePercentage,
							minRange,
							maxRange
						);
						runOnJS(setCurrentBottomValue)(Math.round(snappedValueFromPercentage));
					}
				} else {
					// No snapping
					let isOverLapping = false;
					if (
						animatedOffsetTop.value +
							Math.abs(animatedOffsetBottom.value) +
							handleSize >
						rheostatSize
					) {
						isOverLapping = true;
					}
					if (panType === "top" && isOverLapping) {
						const newTop =
							rheostatHeight -
							(Math.abs(animatedOffsetBottom.value) + 2 * handleSize);
						animatedOffsetTop.value = newTop;
					}
					if (panType === "bottom" && isOverLapping) {
						const newBottom = rheostatSize - (animatedOffsetTop.value + handleSize);
						animatedOffsetBottom.value = -newBottom;
					}
					if (panType === "top") {
						// convert animatedOffsetTop.value to percentage
						const snappedValuePercentage =
							(animatedOffsetTop.value / rheostatSize) * 100;
						// get value from percentage
						const snappedValueFromPercentage = algorithm.getValue(
							snappedValuePercentage,
							minRange,
							maxRange
						);
						runOnJS(setCurrentTopValue)(Math.round(snappedValueFromPercentage));
					} else {
						// convert animatedOffsetBottom.value to percentage
						const snappedValuePercentage =
							100 - ((-1 * animatedOffsetBottom.value) / rheostatSize) * 100;
						// get value from percentage
						const snappedValueFromPercentage = algorithm.getValue(
							snappedValuePercentage,
							minRange,
							maxRange
						);
						runOnJS(setCurrentBottomValue)(Math.round(snappedValueFromPercentage));
					}
				}
			})
			.onFinalize(() => {
				lastOffset.value = offset.value;
			})
			.runOnJS(true);
	};

	const animatedStylesTop = useAnimatedStyle(() => ({
		transform: [{ translateY: animatedOffsetTop.value }],
		backgroundColor: "#00857a",
	}));

	const animatedStylesBottom = useAnimatedStyle(() => ({
		transform: [{ translateY: animatedOffsetBottom.value }],
		backgroundColor: "#00857a",
	}));

	const filledBar = useAnimatedStyle(() => {
		return {
			width: LineWidth,
			backgroundColor: "#00857a",
			position: "absolute",
			height:
				rheostatHeight - handleSize - animatedOffsetTop.value + animatedOffsetBottom.value,
			left: rheostatWidth / 2 - LineWidth / 2,
			top: animatedOffsetTop.value + 25,
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
					borderWidth: 1,
					borderColor: "red",
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
					{shouldSnap &&
						showSnapBars &&
						snappingPercentageAlgorithm.map((point, index) => {
							const width = 10 + (point / 100) * 20;
							return (
								<View
									key={index}
									style={{
										width: width,
										height: 1,
										position: "absolute",
										top: `${point}%`,
										left: handleSize / 2 + -width / 2 + 24,
										border: "1px solid white",
									}}
								></View>
							);
						})}
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
						<>
							<GestureDetector gesture={panTop}>
								<Animated.View
									style={[
										{
											backgroundColor: "#00857a",
											width: handleSize,
											height: handleSize,
											alignItems: "center",
											justifyContent: "center",
											borderRadius: 50,
											top: 0,
										},
										animatedStylesTop,
									]}
								>
									<GestureDetector gesture={panTop}>
										<Animated.View
											style={[
												{
													backgroundColor: "#00857a",
													width: handleSize,
													height: handleSize,
													alignItems: "center",
													justifyContent: "center",
													top: 0,
													left: handleSize + 8,

													minWidth: "fit-content",
												},
											]}
										>
											<Text>{currentTopValue}</Text>
										</Animated.View>
									</GestureDetector>
								</Animated.View>
							</GestureDetector>
						</>
					)}

					{/* bottom pan */}
					<GestureDetector gesture={panBottom}>
						<Animated.View
							style={[
								{
									backgroundColor: "#00857a",
									width: handleSize,
									height: handleSize,
									alignItems: "center",
									justifyContent: "center",
									borderRadius: 50,
									top:
										rheostatHeight -
										handleSize -
										(hasDoubleHandle ? handleSize : 0),
								},
								animatedStylesBottom,
							]}
						>
							<GestureDetector gesture={panBottom}>
								<Animated.View
									style={[
										{
											backgroundColor: "#00857a",
											width: handleSize,
											height: handleSize,
											alignItems: "center",
											justifyContent: "center",
											top: 0,
											left: handleSize + 8,
											minWidth: "fit-content",
										},
									]}
								>
									<Text>{Math.round(currentBottomValue)}</Text>
								</Animated.View>
							</GestureDetector>
						</Animated.View>
					</GestureDetector>
				</View>
			</View>
		</GestureHandlerRootView>
	);
}

export default Rheostat;
