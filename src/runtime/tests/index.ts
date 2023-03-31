import { h, render } from "../../runtime/index";
import { Fragment, Text } from '../vnode';

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
// const Comp = {
//   props: ['text'],
//   render(ctx) {
//     return h('div', null, ctx.text);
//   },
// };
// render(
//   h(Fragment, null, [
//     h(Comp, { text: 'text1' },'1'),
//     h(Comp, { text: 'text2' },'2'),
//     h(Comp, { id: 'id' },'3'),
//   ]),
//   document.body
// );
render(
  h('div', null, [h(Fragment, null, [h('h1',null,''), h(Text, null, 'child')])]),
  document.body
);

const Comp = {
  render() {
    return h('p', null, 'comp');
  },
};
render(h('div', null, [h(Comp,null,'')]), document.body);