"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../utils/index");
const reactive_1 = require("../reactive");
const effect_1 = require("../effect");
const ref_1 = require("../ref");
const computed_1 = require("../computed");
it("isObject", () => {
    expect((0, index_1.isObject)({})).toBe(true);
    // expect(true).toBe(true)
});
it("reactive", () => {
    const obj1 = (0, reactive_1.reactive)({
        age: 10
    });
    expect(obj1.age).toBe(10);
});
it("effect", () => {
    const obj1 = (0, reactive_1.reactive)({
        age: 10
    });
    let age;
    (0, effect_1.effect)(() => {
        age = obj1.age + 1;
    });
    // update
    obj1.age++;
    // expect(obj1.age).toBe(11)
    expect(age).toBe(12);
});
it('ref', () => {
    const val = (0, ref_1.ref)(10);
    val.value++;
    expect(val.value).toBe(11);
});
it('computed', () => {
    const obj1 = (0, reactive_1.reactive)({
        age: 10
    });
    const val = (0, computed_1.computed)(() => {
        console.log(obj1);
        return obj1.age + 1;
    });
    obj1.age++;
    expect(val.value).toBe(12);
});
