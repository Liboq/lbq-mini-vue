import { isFunction } from "../utils";
import { effect, track, trigger } from "./effect";
/* 
computed 与 effect 不同点在于 effect 初始化就会执行，每次里面的元素发生变化也会执行 ，computed 则只会在获取该元素时才会调用，有缓存
*/
export const computed = (getterOrOption) => {
  let getter, setter;
  if (isFunction(getterOrOption)) {
    getter = getterOrOption;
    setter = () => {
      console.error("computed do not set");
    };
  } else {
    getter = getterOrOption.get;
    setter = getterOrOption.set;
  }
  return new ComputedImpl(getter, setter);
};
/* 
computed 实现类 */
export class ComputedImpl {
  _value;
  _dirty;
  effect;
  setter;
  constructor(getter, setter) {
    this.setter = setter;
    this._value = undefined;
    this._dirty = true;
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        this._dirty = true;
        trigger(this, "value");
      },
    });
  }
  get value() {
    if (this._dirty) {
      this._value = this.effect();
      this._dirty = false;
      track(this, "value");
    }
    return this._value;
  }
  set value(newVal) {
    this.setter(newVal);
  }
}
