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

const linearAlgorithm = {
	getValue: (position, minRange, maxRange) => {
		return minRange + (position / 100) * (maxRange - minRange);
	},
	getPosition: (value, minRange, maxRange) => {
		return ((value - minRange) / (maxRange - minRange)) * 100;
	},
};

const logAlgorithm = {
	getValue: (position, minRange, maxRange) => {
		// Convert position (0-100) to logarithmic scale
		const normalizedPosition = position / 100; // Normalize position to 0-1 range
		const logMin = Math.log(minRange + 1); // Use log(min + 1) to avoid log(0) error
		const logMax = Math.log(maxRange + 1); // Use log(max + 1) to avoid log(0) error
		const logValue = logMin + normalizedPosition * (logMax - logMin); // Calculate logarithmic value
		return Math.exp(logValue) - 1; // Convert back to linear scale and adjust for offset
	},
	getPosition: (value, minRange, maxRange) => {
		// Convert value back to a logarithmic position
		const logMin = Math.log(minRange + 1);
		const logMax = Math.log(maxRange + 1);
		const logValue = Math.log(value + 1); // Convert value to logarithmic scale
		return ((logValue - logMin) / (logMax - logMin)) * 100; // Normalize back to 0-100 scale
	},
};

const timesFourAlgorithm = {
	getValue: (position, minRange, maxRange) => {
		const normalizedPosition = position / 100;
		return minRange + normalizedPosition * 4 * (maxRange - minRange);
	},
	getPosition: (value, minRange, maxRange) => {
		const normalizedValue = (value - minRange) / (4 * (maxRange - minRange));
		return normalizedValue * 100;
	},
};

const log10Algorithm = {
	getValue: (position, minRange, maxRange) => {
		// Normalize position from 0-100 to 0-1
		const normalizedPosition = position / 100;

		// Logarithmic scale calculations
		const logMin = Math.log10(minRange + 1); // Use log10(min + 1) to avoid log10(0)
		const logMax = Math.log10(maxRange + 1); // Use log10(max + 1) to avoid log10(0)

		// Calculate the logarithmic value for the normalized position
		const logValue = logMin + normalizedPosition * (logMax - logMin);

		// Convert back from log scale to the actual value
		return Math.pow(10, logValue) - 1; // Subtract 1 to offset the +1 added above
	},
	getPosition: (value, minRange, maxRange) => {
		// Convert value to log scale
		const logMin = Math.log10(minRange + 1);
		const logMax = Math.log10(maxRange + 1);
		const logValue = Math.log10(value + 1); // Convert value to logarithmic scale

		// Normalize back to a position between 0-100
		return ((logValue - logMin) / (logMax - logMin)) * 100;
	},
};

const algorithm = {
	linear: linearAlgorithm,
	log: logAlgorithm,
	quadratic: quadraticAlgorithm,
	timesFour: timesFourAlgorithm,
	log10: log10Algorithm,
};

export default algorithm;
