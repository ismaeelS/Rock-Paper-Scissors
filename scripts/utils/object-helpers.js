export function assignValuesToObject(target, source, defaultObject) {
    if (!source) {
        source = defaultObject;
    }

    const targetKeys = Object.keys(target);
    const sourceKeys = Object.keys(source);

    // remove any buttons the target has that the source does not
    // (this part is not applicable to settings since the keys do not change)
    targetKeys.forEach((targetKey) => {
        if (!sourceKeys.includes(targetKey)) {
            delete target[targetKey];
        }
    });

    sourceKeys.forEach((objectKey) => {
        target[objectKey] = source[objectKey];
    });
}

// credits to https://www.youtube.com/watch?v=8s3u656gpkk
export function checkIfObjectValuesAreTheSame(objA, objB) {
    //recursion base cases
    if (objA === objB) return true;

    if (objA == null || objB == null) return false;

    if (String(objA) == "NaN" || String(objB) == "NaN") {
        return String(objA) === String(objB); 
    }
    // doesnt seem to handle nested booleans without the below check
    else if (typeof objA === "boolean" && typeof objB === "boolean") {
        return objA === objB;
    }
    else if (objA.toFixed || objB.toFixed) {
        return objA === objB;
    }

    const specials = ["function", "symbol", "string"];

    if (specials.includes(typeof objA) || specials.includes(typeof objB)) {
        return String(objA) === String(objB);
    }

    //ignore the button key
    const keys1 = String(Object.keys(objA).filter(key => key !== "webElement"));
    const keys2 = String(Object.keys(objB).filter(key => key !== "webElement"));

    //if the keys are either not matching or if they are matching but in a different order
    //handles the case when still default buttons but user has changed order
    if (keys1 !== keys2) {
        return false;
    }

    for (const key of Object.keys(objA)) {
        //ignore the button key and value
        if (key === "webElement") {
            continue;
        }
        if (!checkIfObjectValuesAreTheSame(objA[key], objB[key])) return false;
    }

    return true;
}