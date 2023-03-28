/*
 * @Date: 2023-03-20 13:33:18
 * @LastEditors: Liboq 99778162+Liboq@users.noreply.github.com
 * @LastEditTime: 2023-03-20 15:42:15
 */
import { describe, it ,expect } from 'vitest';
import { h } from "../vnode";
import { goodLengthOfLTS } from '../render';

it("runtime", () => {
  const vnode = h(
    "div",
    {
      class: "a b",
      style: {
        border: "1px solid",
        fontSize: "14px",
      },
      onClick: () => console.log("click"),
      id: "foo",
      checked: "",
      custom: false,
    },
    [
      h("ul", null, [
        h("li", { style: { color: "red" } }, 1),
        h("li", null, 2),
        h("li", { style: { color: "blue" } }, 3),
        h("Fragment", null, [h("li", null, null)]),
        h("li", { style: { color: "red" } }, 1),
      ]),
    ]
  );
});
it("goodLengthOfLTS",()=>{
  const source = [5,6,1,3,8,9,4]
  const seq= goodLengthOfLTS(source)
  // 先计算出最长上升数组 [1,3,8,9]
  // 然后计算出最长上升数组对应上方source数组的下标数组为[2,3,4,5]
  expect(seq).toEqual([2,3,4,5])
})
