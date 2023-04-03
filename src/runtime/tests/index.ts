import { h, render } from "../../runtime/index";
import { Fragment, Text } from '../vnode';
import { ref } from '../../reactivity/ref';

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
// render(
//   h('div', null, [h(Fragment, null, [h('h1',null,''), h(Text, null, 'child')])]),
//   document.body
// );

// const Comp = {
//   render() {
//     return h('p', null, 'comp');
//   },
// };
// render(h('div', null, [h(Comp,null,'')]), document.body);

const value = ref(true);
let parentVnode;
let childVnode1;
let childVnode2;

const Parent = {
  render: () => {
    // let Parent first rerender
    return (parentVnode = h(Child));
  },
};

const Child = {
  render: () => {
    return value.value
      ? (childVnode1 = h('div',null,`${value.value}`))
      : (childVnode2 = h('span',null,2));
  },
};
setTimeout(()=>{
  value.value = false
  console.log(value.value);
  
  console.dir(childVnode1,childVnode2);
},5000)

render(h(Parent), document.body);
console.dir(childVnode1,childVnode2);

