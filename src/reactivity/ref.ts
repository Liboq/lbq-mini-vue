import { isObject, hasChanged } from "../utils/index";
import { reactive } from "./reactive";
import { track, trigger } from "./effect";
export const ref = (value) => {
  if (isRef(value)) {
    return value;
  }
  return new RefImple(value);
};

/* 
ref实现类
*/
export class RefImple {
  __isRef;
  _value;
  constructor(value) {
    this.__isRef = true;
    this._value = convert(value);
  }
  get value() {
    track(this, "value");
    return this._value;
  }
  set value(newValue) {
    if (hasChanged(this._value, newValue)) {
      this._value = convert(newValue);
      trigger(this, "value");
    }
  }
}
export const convert = (value) => {
  return isObject(value) ? reactive(value) : value;
};
export const isRef = (value) => {
  return !!(value && value.__isRef);
};
