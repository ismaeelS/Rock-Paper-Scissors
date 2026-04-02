import { checkIfObjectValuesAreTheSame } from "../../scripts/utils/object-helpers.js";

//test suite for object comparison

//TEST ON SCORES

const score000 = {"wins":0,"losses":0,"ties":0};

const score001 = {"wins":0,"losses":0,"ties":1};

//notices difference between scores
if (!checkIfObjectValuesAreTheSame(score000, score001)) {
    console.log("passed");
}
else {
    console.log("failed comparing the base score with a score containing one tie");
}

//TEST ON SETTINGS

const settingsBase = {"autoplayInterval":2000,"shortcuts":["?","a","r","p","s"],"askBeforeRemove":true,"showWarnings":false};

const settingsIntervalDecreasedTo1 = {"autoplayInterval":1000,"shortcuts":["?","a","r","p","s"],"askBeforeRemove":true,"showWarnings":false};

//notices difference between autoplayIntervals
if (!checkIfObjectValuesAreTheSame(settingsBase, settingsIntervalDecreasedTo1)) {
    console.log("passed");
}
else {
    console.log("failed comparing default settings with settings with interval decreased to 1");
}

const settingsAskFalse = {"autoplayInterval":2000,"shortcuts":["?","a","r","p","s"],"askBeforeRemove":false,"showWarnings":false};

//notices difference between nested booleans
if (!checkIfObjectValuesAreTheSame(settingsBase, settingsAskFalse)) {
    console.log("passed");
}
else {
    console.log("failed comparing default settings with settings with askBeforeRemove set to false");
}

const settingsMinusRPS = {"autoplayInterval":2000,"shortcuts":["?","a"],"askBeforeRemove":true,"showWarnings":false};

//notices difference between nested arrays
if (!checkIfObjectValuesAreTheSame(settingsBase, settingsMinusRPS)) {
    console.log("passed");
}
else {
    console.log("failed comparing default settings with settings with no rps shortcuts removed");
}

//TEST OF WEAPONS

const weaponsBaseButtons = {"rock":{"beats":["scissors"],"ties":[],"shortcut":"r","button":{}},"paper":{"beats":["rock"],"ties":[],"shortcut":"p","button":{}},"scissors":{"beats":["paper"],"ties":[],"shortcut":"s","button":{}}};

const weaponsBase = {"rock":{"beats":["scissors"],"ties":[],"shortcut":"r"},"paper":{"beats":["rock"],"ties":[],"shortcut":"p"},"scissors":{"beats":["paper"],"ties":[],"shortcut":"s"}};

//ignores button keys when comparing
if (checkIfObjectValuesAreTheSame(weaponsBaseButtons, weaponsBase)) {
    console.log("passed");
}
else {
    console.log("failed comparing weapons object with button entries with weapons object without buttons entries");
}

const weaponsNoRockShortcut = {"rock":{"beats":["scissors"],"ties":[]},"paper":{"beats":["rock"],"ties":[],"shortcut":"p"},"scissors":{"beats":["paper"],"ties":[],"shortcut":"s"}};

//notices difference of existing nested key-value pairs
if (!checkIfObjectValuesAreTheSame(weaponsBaseButtons, weaponsNoRockShortcut)) {
    console.log("passed");
}
else {
    console.log("failed comparing base weapons object with base weapons object but without a shortcut for rock");
}

//TEST ON GENERAL

const objectWithEveryCase1A = {
    a: {phil: {age: 30, job: ['teacher', 'blah']}},
    b: 2,
    c: {foo: 2, bar: 1},
    d: {baz: 1, bat: 2, arr: [2,3]},
    f: function hi(){},
    g: null,
    h: Symbol('his'),
    i: NaN,
    j: Infinity,
    k: 'hi!',
    l: Date.now(),
    m: Promise,
};
const objectWithEveryCase1B = {
    a: {phil: {age: 30, job: ['teacher', 'blah']}},
    b: 2,
    c: {foo: 2, bar: 1},
    d: {baz: 1, bat: 2, arr: [2,3]},
    f: function hi(){},
    g: null,
    h: Symbol('his'),
    i: NaN,
    j: Infinity,
    k: 'hi!',
    l: Date.now(),
    m: Promise,
};

//is able to compare all types
if (checkIfObjectValuesAreTheSame(objectWithEveryCase1A, objectWithEveryCase1B)) {
    console.log("passed");
}
else {
    console.log("failed comparing identical complex ojects");
}