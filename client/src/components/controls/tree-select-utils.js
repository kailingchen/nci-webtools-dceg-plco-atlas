export function containsVal(arr, val) {
    let result = false;
    for (var i = 0; i < arr.length; i++) {
        if ((arr[i].value ? arr[i].value : arr[i]) === val) {
        result = true;
        }
    }
    return result;
};

export function containsAllVals(arr, vals) {
    let result = true;
    for (var i = 0; i < vals.length; i++) {
      if (!containsVal(arr, vals[i].value ? vals[i].value : vals[i])) {
        result = false;
      }
    }
    return result;
};

export function removeVal(arr, val) {
    for (var i = 0; i < arr.length; i++) {
      if ((arr[i].value ? arr[i].value : arr[i]) === val) {
        arr.splice(i, 1);
      }
    }
    return arr;
};

export function removeAllVals(arr, vals) {
    for (var i = 0; i < vals.length; i++) {
      removeVal(arr, vals[i].value ? vals[i].value : vals[i]);
    }
    return arr;
};
