import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	runOnJS,
	useDerivedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import algo from "./algorithms";

const CONSTANTS = {
	TRIANGLE_SIZE_X: 6,
	TRIANGLE_SIZE_Y: 8,
};

const styles = StyleSheet.create({
	bar: {
		position: "absolute",
		borderStyle: "solid",
		borderColor: "#b5b5b5",
		borderWidth: 1,
	},
	line: {
		backgroundColor: "teal",
		position: "absolute",
	},
	triangleLeft: {
		borderTopWidth: CONSTANTS.TRIANGLE_SIZE_X,
		borderBottomWidth: CONSTANTS.TRIANGLE_SIZE_X,
		borderRightWidth: CONSTANTS.TRIANGLE_SIZE_Y,
		borderLeftWidth: 0,
		borderTopColor: "transparent",
		borderBottomColor: "transparent",
		borderLeftColor: "#00857a",
		borderRightColor: "#00857a",
		position: "absolute",
	},
	traingleRight: {
		borderTopWidth: CONSTANTS.TRIANGLE_SIZE_X,
		borderBottomWidth: CONSTANTS.TRIANGLE_SIZE_X,
		borderLeftWidth: CONSTANTS.TRIANGLE_SIZE_Y,
		borderRightWidth: 0,
		borderTopColor: "transparent",
		borderBottomColor: "transparent",
		borderLeftColor: "#00857a",
		borderRightColor: "#00857a",
		position: "absolute",
	},
	transparentText: {
		color: "transparent",
	},

	handleTop: {
		backgroundColor: "#00857a",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 50,
		top: 0,
	},

	handleBottom: {
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 50,
		backgroundColor: "#00857a",
	},

	label: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		whiteSpace: "nowrap",
	},
	filledBarTop: {
		backgroundColor: "#b5b5b5",
		position: "absolute",
		top: 0,
		zIndex: 1,
	},
	filledBarBottom: {
		backgroundColor: "#b5b5b5",
		position: "absolute",
		bottom: 0,
		zIndex: 1,
	},
});

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

	topLabel = "",
	bottomLabel = "",

	suffix = "",
}) {
	const rheostatSize = rheostatHeight - handleSize;

	// re-animated states
	const animatedOffsetTop = useSharedValue(topValue);
	const animatedLastOffsetTop = useSharedValue(topValue);
	const animatedOffsetBottom = useSharedValue(bottomValue);
	const animatedLastOffsetBottom = useSharedValue(bottomValue);

	const topPercentage = useDerivedValue(() => {
		return algorithm.getPosition(animatedOffsetTop.value, minRange, maxRange);
	}, [animatedOffsetTop]);

	const bottomPercentage = useDerivedValue(() => {
		return algorithm.getPosition(Math.abs(animatedOffsetBottom.value), minRange, maxRange);
	}, [animatedOffsetBottom]);

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

	const dyanmmicStyles = StyleSheet.create({
		label: {
			alignItems: "center",
			textAlign: "center",
			width: rheostatWidth,
		},
		handleBottom: {
			backgroundColor: "#00857a",
			alignItems: "center",
			justifyContent: "center",
			top: 0,
			borderRadius: 3,
			zIndex: 1,

			left: handleSize + suffix.length * 4 + 16,
			width: handleSize,
			height: handleSize,
		},
		tooltipTop: {
			backgroundColor: "#00857a",
			alignItems: "center",
			justifyContent: "center",
			top: 0,
			borderRadius: 3,
			left: handleSize + suffix.length * 4 + 16,
			width: handleSize,
			height: handleSize,
		},
	});

	const getGesturePan = (panType) => {
		return Gesture.Pan()
			.onBegin(() => {})
			.onChange((event) => {
				// rheostat size -> size of the rheostat in (pixels/dpi)
				// handle size -> size of the handle in (pixels/dpi)
				// offset -> offset of the handle from the top of the rheostat in (pixels/dpi)
				// value -> value is the value of the handle in the range of min and max (not related to pixels/dpi)
				// percentage -> percentage is the filled percentage of top or bottom handle in the rheostat
				// when top is at 0% rheostat is at 0th pixel/dpi
				// when bottom is at 0% rheostat is at rheostat size - handle size pixel/dpi
				// distanceTop -> size of the top handle in pixels/dpi
				// distanceBottom -> size of the bottom handle in pixels/dpi

				function getClosestIndex(array, target, leftIndex, rightIndex) {
					let left = leftIndex || 0;
					let right = rightIndex || array.length - 1;

					while (left <= right) {
						let mid = Math.floor((left + right) / 2);

						if (array[mid] === target) {
							return mid;
						} else if (array[mid] < target) {
							left = mid + 1;
						} else {
							right = mid - 1;
						}
					}

					// If the target is not found, find the closest index
					let closestIndex =
						Math.abs(array[left] - target) < Math.abs(array[right] - target)
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

				// movement PAN
				if (panType === "bottom") {
					animatedOffsetBottom.value =
						animatedLastOffsetBottom.value + event.translationY;
				} else {
					animatedOffsetTop.value = animatedLastOffsetTop.value + event.translationY;
				}

				// boundary check
				if (panType === "bottom") {
					animatedOffsetBottom.value = Math.max(
						-rheostatSize,
						animatedOffsetBottom.value
					);
					animatedOffsetBottom.value = Math.min(0, animatedOffsetBottom.value);
				} else {
					animatedOffsetTop.value = Math.max(0, animatedOffsetTop.value);
					animatedOffsetTop.value = Math.min(rheostatSize, animatedOffsetTop.value);
				}

				const offsetTopPercentage =
					(Math.abs(animatedOffsetTop.value) / rheostatSize) * 100;
				const offsetBottomPercentage =
					(Math.abs(animatedOffsetBottom.value) / rheostatSize) * 100;

				// with respect to offset percentage what is the distance of handles
				let distanceTop = offsetTopPercentage * (rheostatSize / 100);
				let distanceBottom = offsetBottomPercentage * (rheostatSize / 100);

				if (!shouldSnap) {
					distanceTop = flipped ? distanceTop : rheostatSize - distanceTop;
					distanceBottom = !flipped ? rheostatSize - distanceBottom : distanceBottom;

					const overLapping = distanceTop + handleDelta + distanceBottom > rheostatSize;

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
								animatedOffsetTop.value = distanceBottom + handleDelta;
							} else {
								animatedOffsetTop.value =
									rheostatSize - distanceBottom - handleDelta;
							}
						} else {
							runOnJS(setCurrentTopValue)(valueTop);
						}
					} else {
						if (overLapping) {
							if (!flipped) {
								animatedOffsetBottom.value = -distanceTop - handleDelta;
								animatedLastOffsetBottom.value = -distanceTop - handleDelta;
							} else {
								animatedOffsetBottom.value =
									-rheostatSize + distanceTop + handleDelta;
							}
						} else {
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
						runOnJS(setCurrentTopValue)(offsetBoundBoundaryContained);
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

	const animatedBarStylesTop = useAnimatedStyle(() => ({
		height: flipped
			? Math.abs(animatedOffsetTop.value)
			: rheostatSize - Math.abs(animatedOffsetBottom.value),
	}));

	const animatedBarStylesBottom = useAnimatedStyle(() => ({
		height: flipped
			? Math.abs(animatedOffsetBottom.value)
			: rheostatSize - Math.abs(animatedOffsetTop.value),
	}));

	// const computedValueTop = Math.round(currentTopValue).toString();
	// const computedValueBottom = Math.round(currentBottomValue).toString();
	// const diffTop = Math.abs(String(maxRange).length - computedValueTop.length);
	// const diffBottom = Math.abs(String(maxRange).length - computedValueBottom.length);

	const panTop = getGesturePan("top");
	const panBottom = getGesturePan("bottom");

	return (
		<GestureHandlerRootView>
			{/* top label */}
			{topLabel && <View style={dyanmmicStyles.label}>{topLabel}</View>}

			<View
				style={{
					width: rheostatWidth,
					height: rheostatHeight,
					overflow: "hidden",
				}}
			>
				{/* filled bar top */}
				<Animated.View
					style={[
						animatedBarStylesTop,
						styles.filledBarTop,
						{
							width: LineWidth,
							left: rheostatWidth / 2 - LineWidth / 2,
						},
					]}
				/>

				{/* filled bar bottom */}
				<Animated.View
					style={[
						animatedBarStylesBottom,
						styles.filledBarBottom,
						{
							left: rheostatWidth / 2 - LineWidth / 2,
							width: LineWidth,
						},
					]}
				/>

				{/* line */}
				<View
					style={[
						styles.line,
						{
							left: rheostatWidth / 2 - LineWidth / 2,
							top: handleSize / 2,
							width: LineWidth,
							height: rheostatSize,
						},
					]}
				>
					{shouldSnap &&
						showSnapBars &&
						snappingPercentageAlgorithm.map((point, index) => {
							const width = 10 + (point / 100) * 20;
							return (
								<View
									key={index}
									style={[
										styles.bar,
										{
											left: handleSize / 2 + -width / 2 + 24,
											width: width,
											height: 1,
										},
										flipped ? { top: `${point}%` } : { bottom: `${point}%` },
									]}
								/>
							);
						})}
				</View>

				{/* pit points */}
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
								styles.handleTop,
								{
									width: handleSize,
									height: handleSize,
								},
								animatedStylesTop,
							]}
						>
							{/* <GestureDetector gesture={panTop}>
                <Animated.View style={dyanmmicStyles.tooltipTop}>
                  <Text
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {`${Math.round(computedValueTop)} ${suffix}`}
                    <Text style={styles.transparentText}>{'0'.repeat(diffTop)}</Text>
                  </Text>

                  <View
                    style={[
                      styles.triangleLeft,
                      {
                        position: 'absolute',

                        left: -CONSTANTS.TRIANGLE_SIZE_Y,
                      },
                    ]}
                  />
                </Animated.View>
              </GestureDetector> */}
						</Animated.View>
					</GestureDetector>

					{/* bottom pan */}
					<GestureDetector gesture={panBottom}>
						<Animated.View
							style={[
								styles.handleBottom,
								{
									width: handleSize,
									height: handleSize,
									top:
										rheostatHeight -
										handleSize -
										(hasDoubleHandle ? handleSize : 0),
								},
								animatedStylesBottom,
							]}
						>
							{/* <GestureDetector gesture={panBottom}>
                <Animated.View style={[dyanmmicStyles.handleBottom]}>
                  <Text style={styles.label}>
                    {`${Math.round(computedValueBottom)} ${suffix}`}
                    <Text style={styles.transparentText}>{'0'.repeat(diffBottom)}</Text>
                  </Text>
                  <View
                    style={[
                      styles.triangleLeft,
                      {
                        position: 'absolute',
                        left: -CONSTANTS.TRIANGLE_SIZE_Y,
                      },
                    ]}
                  />
                </Animated.View>
              </GestureDetector> */}
						</Animated.View>
					</GestureDetector>
				</View>
			</View>

			{/* bottom label */}
			{bottomLabel && <View style={dyanmmicStyles.label}>{bottomLabel}</View>}
		</GestureHandlerRootView>
	);
}

export default Rheostat;
