import { checkIfObjectValuesAreTheSame } from "../../scripts/utils/object-helpers.js";

describe("test suite: object comparison", () => {

    describe("test on score", () => {
        const score001 = {"wins":0,"losses":0,"ties":1};
        
        const score000 = {"wins":0,"losses":0,"ties":0};
        
        it("notices difference between scores", () => {
            expect(checkIfObjectValuesAreTheSame(score000, score001)).toBeFalse();
        });
    });
    
    describe("test on settings", () => {
        const settingsBase = {"autoplayInterval":2000,"shortcuts":["?","a","r","p","s"],"askBeforeRemove":true,"showWarnings":false};
        
        const settingsIntervalDecreasedTo1 = {"autoplayInterval":1000,"shortcuts":["?","a","r","p","s"],"askBeforeRemove":true,"showWarnings":false};
        
        it("notices difference between number values from the same key", () => {
            expect(checkIfObjectValuesAreTheSame(settingsBase, settingsIntervalDecreasedTo1)).toBeFalse();
        });
        
        const settingsAskFalse = {"autoplayInterval":2000,"shortcuts":["?","a","r","p","s"],"askBeforeRemove":false,"showWarnings":false};
        
        it("notices difference between boolean values from the same key", () => {
            expect(checkIfObjectValuesAreTheSame(settingsBase, settingsAskFalse)).toBeFalse();
        });

        const settingsMinusRPS = {"autoplayInterval":2000,"shortcuts":["?","a"],"askBeforeRemove":true,"showWarnings":false};

        it("notices difference between array index values from the same key", () => {
            expect(checkIfObjectValuesAreTheSame(settingsBase, settingsMinusRPS)).toBeFalse();
        });
    });

    describe("test on weapons", () => {
        const weaponsBaseButtons = {"rock":{"beats":["scissors"],"ties":[],"shortcut":"r","button":{}},"paper":{"beats":["rock"],"ties":[],"shortcut":"p","button":{}},"scissors":{"beats":["paper"],"ties":[],"shortcut":"s","button":{}}};
        
        const weaponsBase = {"rock":{"beats":["scissors"],"ties":[],"shortcut":"r"},"paper":{"beats":["rock"],"ties":[],"shortcut":"p"},"scissors":{"beats":["paper"],"ties":[],"shortcut":"s"}};
        
        it("ignores button keys when comparing", () => {
            expect(checkIfObjectValuesAreTheSame(weaponsBaseButtons, weaponsBase)).toBeTrue();
        });

        const weaponsNoRockShortcut = {"rock":{"beats":["scissors"],"ties":[]},"paper":{"beats":["rock"],"ties":[],"shortcut":"p"},"scissors":{"beats":["paper"],"ties":[],"shortcut":"s"}};

        it("notices difference of key-value pairs (rock shortcut removed)", () => {
            expect(checkIfObjectValuesAreTheSame(weaponsBaseButtons, weaponsNoRockShortcut)).toBeFalse();
        });
    });

    describe("general", () => {
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

        it("is able to compare all types", () => {
            expect(checkIfObjectValuesAreTheSame(objectWithEveryCase1A, objectWithEveryCase1B)).toBeTrue();
        });

    });
});