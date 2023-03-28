import { h, render } from "../../runtime/index";
import { Fragment } from '../vnode';

// const vnode = 
//         h("ul", null, [
//           h("li", { style: { color: "red" } }, 1),
//           h("li", null, 2),
//           h("li", { style: { color: "blue" } }, 3),
//           h(Fragment, null, [h("li", null, null)]),
//           h("li", { style: { color: "red" } }, 1),
//         ])
//     ;
// render(vnode, document.body);
// setTimeout(() => {
//   render(
//         h("ul", null, [
//           h("li", { style: { color: "green" } }, 5),
//           h("li", null, 8),
//           h("li", { style: { color: "red" } }, 6),
//           h(Fragment, null, [h("li", null, "middle")]),
//           h("li", { style: { color: "blue" } }, 7),
//         ]),
//     document.body
//   );
// },2000);
const vnode1 =[
  {
    type: "h1",
    props: null,
    children: "1",
    shapeFlag: 17,
    el: {
    },
    anchor: null,
    key: null,
  },
  {
    type: "h2",
    props: null,
    children: "1",
    shapeFlag: 17,
    el: {
    },
    anchor: null,
    key: null,
  },
  {
    type: "h3",
    props: null,
    children: "1",
    shapeFlag: 17,
    el: {
    },
    anchor: null,
    key: null,
  },
  {
    type: "h4",
    props: null,
    children: "1",
    shapeFlag: 17,
    el: {
    },
    anchor: null,
    key: null,
  },
  {
    type: "h5",
    props: null,
    children: "1",
    shapeFlag: 17,
    el: {
    },
    anchor: null,
    key: null,
  },
  {
    type: "h6",
    props: null,
    children: "1",
    shapeFlag: 17,
    el: {
    },
    anchor: null,
    key: null,
  },
]
render(h('div',null,vnode1),document.body)
