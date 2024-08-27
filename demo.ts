const minRange = 0
const maxRange = 800

const topIndex = 3
const buttonIndex = 5
const snappingPoints = [minRange, 50, 100, 200, 400, maxRange]

function jslog(...args) {
    console.clear()
    console.log(JSON.stringify(args, null, 4))
}

const normalizeRange = (value, minimum, maximum) => {
    return (value - minimum) / (maximum - minimum);
};

const snappingPercentagePoints = snappingPoints.map((point) => {
    return normalizeRange(point, minRange, maxRange) * 100;
});


function getClosestIndex(snappingPoints, target) {
    let left = 0;
    let right = snappingPoints.length - 1;

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
    let closestIndex = Math.abs(snappingPoints[left] - target) < Math.abs(snappingPoints[right] - target) ? left : right;
    return closestIndex;
}

function getIndexLessThanTarget(snappingPoints, target) {
    let left = 0;
    let right = snappingPoints.length - 1;

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


let topHandleValue = 200
let topHandleIndex = getClosestIndex(snappingPoints, topHandleValue)
let topHandlePercentage = snappingPercentagePoints[topHandleIndex]

let bottomHandleValue = 100
let bottomHandleIndex = getClosestIndex(snappingPoints, bottomHandleValue)
let bottomHandlePercentage = snappingPercentagePoints[bottomHandleIndex]


if (topHandleValue > bottomHandleValue) {
    bottomHandleIndex = getIndexMoreThanTarget(snappingPoints, topHandleValue)
    bottomHandleValue = snappingPoints[bottomHandleIndex]
    bottomHandlePercentage = snappingPercentagePoints[bottomHandleIndex]
}

console.log("leftmost range:", topHandleValue)
console.log("rightmost range:", bottomHandleValue)

// const leftIndex = topHandleIndex
// const rightIndex = bottomHandleIndex

// topHandleIndex = getClosestIndex(snappingPoints, snappingPoints[leftIndex]);
// topHandlePercentage = snappingPercentagePoints[topHandleIndex];
// topHandleValue = snappingPoints[topHandleIndex];

// bottomHandleIndex = getClosestIndex(snappingPoints, snappingPoints[rightIndex]);
// bottomHandlePercentage = snappingPercentagePoints[bottomHandleIndex];
// bottomHandleValue = snappingPoints[bottomHandleIndex];

// console.log("snappingPoints", snappingPoints);
// console.log("leftIndex", leftIndex);
// console.log("rightIndex", rightIndex);

// console.log("topHandleIndex", topHandleIndex);
// console.log("topHandlePercentage", topHandlePercentage);
// console.log("topHandleValue", topHandleValue);

// console.log("bottomHandleIndex", bottomHandleIndex);
// console.log("bottomHandlePercentage", bottomHandlePercentage);
// console.log("bottomHandleValue", bottomHandleValue);
