import { h, render } from "../../runtime/index";
import { Fragment } from '../vnode';

const vnode = 
        h("ul", null, [
          h("li", { style: { color: "red" } }, 1),
          h("li", null, 2),
          h("li", { style: { color: "blue" } }, 3),
          h(Fragment, null, [h("li", null, null)]),
          h("li", { style: { color: "red" } }, 1),
        ])
    ;
render(vnode, document.body);
setTimeout(() => {
  render(
        h("ul", null, [
          h("li", { style: { color: "green" } }, 5),
          h("li", null, 8),
          h("li", { style: { color: "red" } }, 6),
          h(Fragment, null, [h("li", null, "middle")]),
          h("li", { style: { color: "blue" } }, 7),
        ]),
    document.body
  );
},2000);
