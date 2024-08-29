import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, runOnJS } from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import algo from "./algorithms";

function jslog(...args) {
	console.log(JSON.stringify(args, null, 4));
}

const CONSTANTS = {
	TRIANGLE_SIZE_X: 6,
	TRIANGLE_SIZE_Y: 8,
};

const styles = StyleSheet.create({
	triangleLeft: {
		borderTopWidth: CONSTANTS.TRIANGLE_SIZE_X,
		borderBottomWidth: CONSTANTS.TRIANGLE_SIZE_X,
		borderRightWidth: CONSTANTS.TRIANGLE_SIZE_Y,
		borderLeftWidth: 0,
		borderTopColor: "transparent",
		borderBottomColor: "transparent",
		borderLeftColor: "hotpink",
		borderRightColor: "hotpink",
		position: "absolute",
	},
	traingleRight: {
		borderTopWidth: CONSTANTS.TRIANGLE_SIZE_X,
		borderBottomWidth: CONSTANTS.TRIANGLE_SIZE_X,
		borderLeftWidth: CONSTANTS.TRIANGLE_SIZE_Y,
		borderRightWidth: 0,
		borderTopColor: "transparent",
		borderBottomColor: "transparent",
		borderLeftColor: "hotpink",
		borderRightColor: "hotpink",
		position: "absolute",
	},
});

function getClosestIndex(snappingPoints, target, leftIndex, rightIndex) {
	let left = leftIndex || 0;
	let right = rightIndex || snappingPoints.length - 1;

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

function getLessThanTarget(array, target) {
	let left = 0;
	let right = array.length - 1;

	while (left <= right) {
		let mid = Math.floor((left + right) / 2);

		if (array[mid] >= target) {
			right = mid - 1;
		} else {
			left = mid + 1;
		}
	}

	return right >= 0 ? right : left;
}

function getMoreThanTarget(array, target) {
	let left = 0;
	let right = array.length - 1;

	while (left <= right) {
		let mid = Math.floor((left + right) / 2);

		if (array[mid] <= target) {
			left = mid + 1;
		} else {
			right = mid - 1;
		}
	}

	return left < array.length ? left : right;
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
	flipped = false,
	handleSize = 20,
	handleDelta = 25,
}) {
	const rheostatSize = rheostatHeight - handleSize;
	const topPercentage = useSharedValue(algorithm.getPosition(topValue, minRange, maxRange));
	const bottomPercentage = useSharedValue(algorithm.getPosition(bottomValue, minRange, maxRange));

	// re-animated states
	const animatedOffsetTop = useSharedValue(topValue);
	const animatedLastOffsetTop = useSharedValue(topValue);

	const animatedOffsetBottom = useSharedValue(bottomValue);
	const animatedLastOffsetBottom = useSharedValue(bottomValue);

	const [currentBottomValue, setCurrentBottomValue] = useState(topValue);
	const [currentTopValue, setCurrentTopValue] = useState(bottomValue);

	// Ref to track initial render
	const isInitialRender = React.useRef({
		top: true,
		bottom: true,
	});

	useEffect(() => {
		const topOffset = topPercentage.value * (rheostatSize / 100);
		const bottomOffset = rheostatSize - bottomPercentage.value * (rheostatSize / 100);

		animatedLastOffsetTop.value = flipped ? topOffset : rheostatSize - topOffset;
		animatedOffsetTop.value = flipped ? topOffset : rheostatSize - topOffset;

		animatedLastOffsetBottom.value = flipped
			? -1 * bottomOffset
			: -1 * (rheostatSize - bottomOffset);
		animatedOffsetBottom.value = flipped
			? -1 * bottomOffset
			: -1 * (rheostatSize - bottomOffset);

		setCurrentTopValue(topValue);
		setCurrentBottomValue(bottomValue);
	}, [flipped]);

	useEffect(() => {
		// in controlled mode when topValue changes from prop
		// we need to update the rheostat position accordingly
		// but on 1st render we don't want to update the rheostat position
		// because it will be already set to the correct position
		if (isInitialRender.current.top) {
			isInitialRender.current.top = false;
		} else {
			const topOffset =
				algorithm.getPosition(topValue, minRange, maxRange) * (rheostatSize / 100);

			animatedOffsetTop.value = flipped ? topOffset : rheostatSize - topOffset;
			animatedLastOffsetTop.value = flipped ? topOffset : rheostatSize - topOffset;

			topPercentage.value = topOffset * (100 / rheostatSize);
			setCurrentTopValue(topValue);
		}
	}, [topValue, flipped]);

	useEffect(() => {
		// in controlled mode when bottomValue changes from prop
		// we need to update the rheostat position accordingly
		// but on 1st render we don't want to update the rheostat position
		// because it will be already set to the correct position
		if (isInitialRender.current.bottom) {
			isInitialRender.current.bottom = false;
		} else {
			let bottomOffset =
				algorithm.getPosition(bottomValue, minRange, maxRange) * (rheostatSize / 100);
			bottomOffset = flipped ? -1 * (rheostatSize - bottomOffset) : -1 * bottomOffset;
			animatedOffsetBottom.value = bottomOffset;
			animatedLastOffsetBottom.value = bottomOffset;

			bottomPercentage.value = -1 * bottomOffset * (100 / rheostatSize);
			setCurrentBottomValue(bottomValue);
		}
	}, [bottomValue, flipped]);

	const snappingPercentageAlgorithm = snappingPoints
		.map((point) => {
			const snapValue = Math.max(0, algorithm.getPosition(point, minRange, maxRange));
			return Number(snapValue.toFixed(2));
		})
		.sort((a, b) => a - b);

	const LineWidth = 4;
	const hasDoubleHandle = true;

	const getGesturePan = (panType) => {
		return Gesture.Pan()
			.onBegin(() => {})
			.onChange((event) => {
				console.log("pan active: ", panType);

				// things to consider
				// rheostat size -> size of the rheostat in (pixels/dpi)
				// handle size -> size of the handle in (pixels/dpi)
				// offset -> offset of the handle from the top of the rheostat in (pixels/dpi)
				// value -> value is the value of the handle in the range of min and max (not related to pixels/dpi)
				// percentage -> percentage is the filled percentage of top or bottom handle in the rheostat
				// when top is at 0% rheostat is at 0th pixel/dpi
				// when bottom is at 0% rheostat is at rheostat size - handle size pixel/dpi
				// sizeTop -> size of the top handle in pixels/dpi
				// sizeBottom -> size of the bottom handle in pixels/dpi

				// movement PAN
				if (panType === "bottom") {
					animatedOffsetBottom.value =
						animatedLastOffsetBottom.value + event.translationY;
				} else {
					animatedOffsetTop.value = animatedLastOffsetTop.value + event.translationY;
				}

				if (panType === "bottom") {
					animatedOffsetBottom.value = Math.max(
						-(rheostatHeight - handleSize),
						animatedOffsetBottom.value
					);
					animatedOffsetBottom.value = Math.min(0, animatedOffsetBottom.value);
				} else {
					animatedOffsetTop.value = Math.max(0, animatedOffsetTop.value);
					animatedOffsetTop.value = Math.min(
						rheostatHeight - handleSize,
						animatedOffsetTop.value
					);
				}

				const offsetTopPercentage =
					(Math.abs(animatedOffsetTop.value) / (rheostatHeight - handleSize)) * 100;
				const offsetBottomPercentage =
					(Math.abs(animatedOffsetBottom.value) / (rheostatHeight - handleSize)) * 100;

				// // with respect to offset percentage what is size of the rheostat
				let sizeTop = offsetTopPercentage * (rheostatSize / 100);
				let sizeBottom = offsetBottomPercentage * (rheostatSize / 100);

				if (!shouldSnap) {
					sizeTop = flipped ? sizeTop : rheostatSize - sizeTop;
					sizeBottom = !flipped ? rheostatSize - sizeBottom : sizeBottom;

					const overLapping = sizeTop + handleDelta + sizeBottom > rheostatSize;

					const valueTop = algorithm.getValue(
						flipped ? offsetTopPercentage : 100 - offsetTopPercentage,
						minRange,
						maxRange
					);
					const valueBottom = algorithm.getValue(
						flipped ? 100 - offsetBottomPercentage : offsetBottomPercentage,
						minRange,
						maxRange
					);

					if (panType === "top") {
						if (overLapping) {
							if (!flipped) {
								animatedOffsetTop.value = sizeBottom + handleDelta;
							} else {
								animatedOffsetTop.value = rheostatSize - sizeBottom - handleDelta;
							}
						} else {
							topPercentage.value = offsetTopPercentage;
							runOnJS(setCurrentTopValue)(valueTop);
						}
					} else {
						if (overLapping) {
							if (!flipped) {
								animatedOffsetBottom.value = -sizeTop - handleDelta;
								animatedLastOffsetBottom.value = -sizeTop - handleDelta;
							} else {
								animatedOffsetBottom.value = -rheostatSize + sizeTop + handleDelta;
							}
						} else {
							bottomPercentage.value = offsetBottomPercentage;
							runOnJS(setCurrentBottomValue)(valueBottom);
						}
					}
				}

				if (shouldSnap) {
					const closestBottomIndex = getClosestIndex(
						snappingPercentageAlgorithm,
						flipped ? 100 - offsetBottomPercentage : offsetBottomPercentage
					);

					const closestTopIndex = getClosestIndex(
						snappingPercentageAlgorithm,
						flipped ? offsetTopPercentage : 100 - offsetTopPercentage
					);

					const closestBottomValue = snappingPoints[closestBottomIndex];
					const closestTopValue = snappingPoints[closestTopIndex];

					if (panType === "top") {
						const topPointLowerBoundIndex = getLessThanTarget(
							snappingPoints,
							closestBottomValue
						);

						const offsetBoundBoundaryContained = Math.min(
							snappingPoints[topPointLowerBoundIndex],
							closestTopValue
						);

						const offsetBoundBoundaryContainedPercentage = algorithm.getPosition(
							offsetBoundBoundaryContained,
							minRange,
							maxRange
						);

						let offsetBoundBoundaryContainedSize = flipped
							? offsetBoundBoundaryContainedPercentage * (rheostatSize / 100)
							: rheostatSize -
							  offsetBoundBoundaryContainedPercentage * (rheostatSize / 100);

						animatedOffsetTop.value = offsetBoundBoundaryContainedSize;

						topPercentage.value = offsetBoundBoundaryContainedPercentage;
						runOnJS(setCurrentTopValue)(offsetBoundBoundaryContainedPercentage);
					} else {
						const bottomPointUpperBoundIndex = getMoreThanTarget(
							snappingPoints,
							closestTopValue
						);
						const offsetBoundBoundaryContained = Math.max(
							snappingPoints[bottomPointUpperBoundIndex],
							closestBottomValue
						);
						const offsetBoundBoundaryContainedPercentage = algorithm.getPosition(
							offsetBoundBoundaryContained,
							minRange,
							maxRange
						);

						const offsetBoundBoundaryContainedSize = flipped
							? rheostatSize -
							  offsetBoundBoundaryContainedPercentage * (rheostatSize / 100)
							: offsetBoundBoundaryContainedPercentage * (rheostatSize / 100);

						animatedOffsetBottom.value = -offsetBoundBoundaryContainedSize;
						bottomPercentage.value = offsetBoundBoundaryContainedPercentage;
						runOnJS(setCurrentBottomValue)(offsetBoundBoundaryContained);
					}
				}
			})
			.onFinalize(() => {
				if (panType === "bottom") {
					animatedLastOffsetBottom.value = animatedOffsetBottom.value;
				} else {
					animatedLastOffsetTop.value = animatedOffsetTop.value;
				}
			})
			.runOnJS(true);
	};

	const animatedStylesTop = useAnimatedStyle(() => ({
		transform: [{ translateY: animatedOffsetTop.value }],
	}));

	const animatedStylesBottom = useAnimatedStyle(() => ({
		transform: [{ translateY: animatedOffsetBottom.value }],
	}));

	const filledBar = useAnimatedStyle(() => {
		const diff = Math.abs(topPercentage.value - (100 - bottomPercentage.value));

		const height = diff * (rheostatSize / 100);
		const styles = {
			backgroundColor: "yellow",
			top: rheostatHeight - height - handleSize,
		};

		return {
			width: LineWidth,
			backgroundColor: "hotpink",
			position: "absolute",
			height: height,
			left: rheostatWidth / 2 - LineWidth / 2,
			...styles,
		};
	});

	const computedValueTop = Math.round(currentTopValue).toString();
	const computedValueBottom = Math.round(currentBottomValue).toString();

	const diffTop = Math.abs(String(maxRange).length - computedValueTop.length);
	const diffBottom = Math.abs(String(maxRange).length - computedValueBottom.length);

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
									style={[
										{
											width: width,
											height: 1,
											position: "absolute",

											left: handleSize / 2 + -width / 2 + 24,
											border: "1px solid white",
										},
										flipped ? { top: `${point}%` } : { bottom: `${point}%` },
									]}
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
					<GestureDetector gesture={panTop}>
						<Animated.View
							style={[
								{
									backgroundColor: "hotpink",
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
											backgroundColor: "hotpink",
											alignItems: "center",
											justifyContent: "center",
											top: 0,
											left: handleSize + 16,
											minWidth: "fit-content",
											borderRadius: 3,

											width: handleSize,
											height: handleSize,
										},
									]}
								>
									<Text
										style={{
											paddingHorizontal: 8,
											paddingVertical: 4,
										}}
									>
										{Math.round(computedValueTop)}
										<Text
											style={{
												color: "transparent",
											}}
										>
											{"0".repeat(diffTop)}
										</Text>
									</Text>

									<View
										style={[
											styles.triangleLeft,
											{
												position: "absolute",

												left: -CONSTANTS.TRIANGLE_SIZE_Y,
											},
										]}
									></View>
								</Animated.View>
							</GestureDetector>
						</Animated.View>
					</GestureDetector>

					{/* bottom pan */}
					<GestureDetector gesture={panBottom}>
						<Animated.View
							style={[
								{
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
								{
									backgroundColor: "red",
								},
							]}
						>
							<GestureDetector gesture={panBottom}>
								<Animated.View
									style={[
										{
											backgroundColor: "red",
											alignItems: "center",
											justifyContent: "center",
											top: 0,
											left: handleSize + 16,
											minWidth: "fit-content",
											borderRadius: 3,

											width: handleSize,
											height: handleSize,
										},
									]}
								>
									<Text
										style={{
											paddingHorizontal: 8,
											paddingVertical: 4,
											color: "white",
										}}
									>
										{Math.round(computedValueBottom)}
										<Text
											style={{
												color: "transparent",
											}}
										>
											{"0".repeat(diffBottom)}
										</Text>
									</Text>
									<View
										style={[
											styles.triangleLeft,
											{
												position: "absolute",
												left: -CONSTANTS.TRIANGLE_SIZE_Y,
											},
										]}
									></View>
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
