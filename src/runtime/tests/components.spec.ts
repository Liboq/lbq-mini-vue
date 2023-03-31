
import { render } from '../render';
import { h, Text, Fragment } from '../vnode';
import { ref, reactive, computed } from '../../reactivity';
import { nextTick } from '../scheduler';
import { beforeEach ,it,describe,expect} from 'vitest';

let root;
beforeEach(() => {
  root = document.createElement('div');
});

describe('mount component', () => {
  it('mount simple component', () => {
    const Comp = {
      render() {
        return h('div',null,'');
      },
    };
    render(h(Comp,null,''), root);
    expect(root.innerHTML).toBe('<div></div>');
  });

  it('mount component with props', () => {
    let foo, bar;
    const Comp = {
      props: ['foo'],
      render(ctx) {
        foo = ctx.foo;
        bar = ctx.bar;
        // ctx即是this，省略this实现
        return h('div', null, ctx.foo);
      },
    };
    render(h(Comp, { foo: 'foo', bar: 'bar' },''), root);
    expect(root.innerHTML).toBe('<div bar="bar">foo</div>');
    expect(foo).toBe('foo');
    expect(bar).toBeUndefined();
  });

  it('should create an Component with props', () => {
    const Comp = {
      render: () => {
        return h('div',null,'');
      },
    };
    render(h(Comp, { id: 'foo', class: 'bar' },''), root);
    expect(root.innerHTML).toBe(`<div id="foo" class="bar"></div>`);
  });

  it('should create an Component with direct text children', () => {
    const Comp = {
      render: () => {
        return h('div', null, 'it');
      },
    };
    render(h(Comp, { id: 'foo', class: 'bar' },''), root);
    expect(root.innerHTML).toBe(`<div id="foo" class="bar">it</div>`);
  });

  it('should expose return values to template render context', () => {
    const Comp = {
      setup() {
        return {
          ref: ref('foo'),
          // object exposed as-is
          object: reactive({ msg: 'bar' }),
          // primitive value exposed as-is
          value: 'baz',
        };
      },
      render(ctx) {
        return `${ctx.ref.value} ${ctx.object.msg} ${ctx.value}`;
      },
    };
    render(h(Comp,null,''), root);
    expect(root.innerHTML).toBe(`foo bar baz`);
  });

  it('mount multi components',  () => {
    const Comp = {
      props: ['text'],
      render(ctx) {
        return h('div', null, ctx.text);
      },
    };
    render(
      h(Fragment, null, [
        h(Comp, { text: 'text1' },'1'),
        h(Comp, { text: 'text2' },'2'),
        h(Comp, { id: 'id' },'3'),
      ]),
      root
    );
    expect(root.innerHTML).toBe(
      '<div>text1</div><div>text2</div><div id="id"></div>'
    );
  });
});
  

// describe('update component trigger by self', () => {
//   it('setup result with event and update', async () => {
//     const Comp = {
//       setup() {
//         const counter = ref(0);
//         const click = () => {
//           counter.value++;
//         };
//         return {
//           counter,
//           click,
//         };
//       },
//       render(ctx) {
//         return h('div', { onClick: ctx.click }, ctx.counter.value);
//       },
//     };
//     render(h(Comp,null,''), root);
//     expect(root.innerHTML).toBe('<div>0</div>');

//     root.children[0].click();
//     await nextTick();
//     expect(root.innerHTML).toBe('<div>1</div>');

//     root.children[0].click();
//     root.children[0].click();
//     await nextTick();
//     expect(root.innerHTML).toBe('<div>3</div>');
//   });

//   it('reactive child, style and class', async () => {
//     const observed = reactive({
//       child: 'child',
//       class: 'a',
//       style: {
//         color: 'red',
//       },
//     });
//     const Comp = {
//       setup() {
//         return {
//           observed,
//         };
//       },
//       render(ctx) {
//         return h(
//           'div',
//           {
//             class: ctx.observed.class,
//             style: ctx.observed.style,
//           },
//           ctx.observed.child
//         );
//       },
//     };
//     render(h(Comp,null,''), root);
//     expect(root.innerHTML).toBe(
//       '<div class="a" style="color: red;">child</div>'
//     );

//     observed.class = 'b';
//     await nextTick();
//     expect(root.innerHTML).toBe(
//       '<div class="b" style="color: red;">child</div>'
//     );

//     observed.style.color = 'blue';
//     await nextTick();
//     expect(root.innerHTML).toBe(
//       '<div class="b" style="color: blue;">child</div>'
//     );

//     observed.child = '';
//     await nextTick();
//     expect(root.innerHTML).toBe('<div class="b" style="color: blue;"></div>');
//   });

//   it('observed props', async () => {
//     const observed = reactive({
//       child: 'child',
//       class: 'a',
//       style: {
//         color: 'red',
//       },
//     });
//     const Comp = {
//       render() {
//         return h('div', observed,'');
//       },
//     };
//     render(h(Comp,null,''), root);
//     expect(root.innerHTML).toBe(
//       '<div child="child" class="a" style="color: red;"></div>'
//     );

//     observed.class = 'b';
//     await nextTick();
//     expect(root.innerHTML).toBe(
//       '<div child="child" class="b" style="color: red;"></div>'
//     );

//     observed.style.color = 'blue';
//     await nextTick();
//     expect(root.innerHTML).toBe(
//       '<div child="child" class="b" style="color: blue;"></div>'
//     );

//     observed.child = '';
//     await nextTick();
//     expect(root.innerHTML).toBe(
//       '<div child="" class="b" style="color: blue;"></div>'
//     );
//   });

//   it('computed and ref props', async () => {
//     const firstName = ref('james');
//     const lastName = ref('bond');
//     const Comp = {
//       setup() {
//         const fullName = computed(() => {
//           return `${firstName.value} ${lastName.value}`;
//         });
//         return {
//           fullName,
//         };
//       },
//       render(ctx) {
//         return h('div', null, ctx.fullName.value);
//       },
//     };
//     render(h(Comp,null,''), root);
//     expect(root.innerHTML).toBe('<div>james bond</div>');

//     firstName.value = 'a';
//     await nextTick();
//     expect(root.innerHTML).toBe('<div>a bond</div>');

//     lastName.value = 'b';
//     await nextTick();
//     expect(root.innerHTML).toBe('<div>a b</div>');
//   });
// });

describe('update component trigger by others', () => {
  it('should update an Component tag which is already mounted', () => {
    const Comp1 = {
      render: () => {
        return h('div', null, 'foo');
      },
    };
    render(h(Comp1,null,''), root);
    expect(root.innerHTML).toBe('<div>foo</div>');

    const Comp2 = {
      render: () => {
        return h('span', null, 'foo');
      },
    };
    render(h(Comp2,null,''), root);
    expect(root.innerHTML).toBe('<span>foo</span>');

    const Comp3 = {
      render: () => {
        return h('p', null, 'bar');
      },
    };
    render(h(Comp3,null,''), root);
    expect(root.innerHTML).toBe('<p>bar</p>');
  });

  it('same component with diffrent props', () => {
    const Comp = {
      props: ['text'],
      render: (ctx) => {
        return h('p', null, ctx.text);
      },
    };
    render(h(Comp, { text: 'bar' },''), root);
    expect(root.innerHTML).toBe('<p>bar</p>');

    render(h(Comp, { text: 'baz' },''), root);
    expect(root.innerHTML).toBe('<p>baz</p>');
  });

  it('element and component switch', () => {
    render(h('div', null, [h('div', null, 'child')]), root);
    expect(root.children[0].innerHTML).toBe('<div>child</div>');

    const Comp = {
      render() {
        return h('p', null, 'comp');
      },
    };
    render(h('div', null, [h(Comp,null,'')]), root);
    expect(root.children[0].innerHTML).toBe('<p>comp</p>');

    render(h('div', null, [h('div', null, 'child')]), root);
    expect(root.children[0].innerHTML).toBe('<div>child</div>');

    render(h('div', null, [h(Comp,null,'')]), root);
    expect(root.children[0].innerHTML).toBe('<p>comp</p>');
  });

  it('component and text switch', () => {
    render(h('div', null, [h(Text, null, 'child')]), root);
    expect(root.children[0].innerHTML).toBe('child');

    const Comp = {
      render() {
        return h('p', null, 'comp');
      },
    };
    render(h('div', null, [h(Comp,null,'')]), root);
    expect(root.children[0].innerHTML).toBe('<p>comp</p>');

    render(h('div', null, [h(Text, null, 'child')]), root);
    expect(root.children[0].innerHTML).toBe('child');

    render(h('div', null, [h(Comp,null,'')]), root);
    expect(root.children[0].innerHTML).toBe('<p>comp</p>');
  });

  it('component and fragment switch', () => {
    render(
      h('div', null, [h(Fragment, null, [h('h1',null,''), h(Text, null, 'child')])]),
      root
    );
    expect(root.children[0].innerHTML).toBe('<h1></h1>child');

    const Comp = {
      render() {
        return h('p', null, 'comp');
      },
    };
    render(h('div', null, [h(Comp,null,'')]), root);
    expect(root.children[0].innerHTML).toBe('<p>comp</p>');

    render(
      h('div', null, [h(Fragment, null, [h('h1',null,''), h(Text, null, 'child')])]),
      root
    );
    expect(root.children[0].innerHTML).toBe('<h1></h1>child');

    render(h('div', null, [h(Comp,null,'')]), root);
    expect(root.children[0].innerHTML).toBe('<p>comp</p>');
  });

  it('parent element of component change', () => {
    const Comp = {
      props: ['text'],
      render(ctx) {
        return h('p', null, ctx.text);
      },
    };

    render(h('div', null, [h(Comp,null,'')]), root);
    expect(root.innerHTML).toBe('<div><p></p></div>');

    render(h('h1', null, [h(Comp, { text: 'text' },''),'']), root);
    expect(root.innerHTML).toBe('<h1><p>text</p></h1>');
  });

  it('parent props update make child update', async () => {
    const text = ref('text');
    const id = ref('id');
    const Parent = {
      render() {
        return h(Child, { text: text.value, id: id.value },'');
      },
    };

    const Child = {
      props: ['text'],
      render(ctx) {
        return h('div', null, ctx.text);
      },
    };

    render(h(Parent,null,''), root);
    expect(root.innerHTML).toBe('<div id="id">text</div>');

    text.value = 'foo';
    await nextTick();
    expect(root.innerHTML).toBe('<div id="id">foo</div>');

    id.value = 'bar';
    await nextTick();
    expect(root.innerHTML).toBe('<div id="bar">foo</div>');
  });

  it('child will not update when props have not change', async () => {
    const text = ref('text');
    const id = ref('id');
    const anotherText = ref('a');
    const Parent = {
      render() {
        return [
          h(Text, null, anotherText.value),
          h(Child, { text: text.value, id: id.value },''),
        ];
      },
    };

    let renderCount = 0;
    const Child = {
      props: ['text'],
      render(ctx) {
        renderCount++;
        return h('div', null, ctx.text);
      },
    };

    render(h(Parent,null,''), root);
    expect(root.innerHTML).toBe('a<div id="id">text</div>');
    expect(renderCount).toBe(1);

    anotherText.value = 'b';
    await nextTick();
    expect(root.innerHTML).toBe('b<div id="id">text</div>');
  });

  it('switch child', async () => {
    const Parent = {
      setup() {
        const toggle = ref(true);
        const click = () => {
          toggle.value = !toggle.value;
        };
        return {
          toggle,
          click,
        };
      },
      render(ctx) {
        return [
          ctx.toggle.value ? h(Child1,null,'') : h(Child2,null,''),
          h('button', { onClick: ctx.click }, 'click'),
        ];
      },
    };

    const Child1 = {
      render() {
        return h('div',null,'');
      },
    };

    const Child2 = {
      render() {
        return h('p',null,'');
      },
    };

    render(h(Parent,null,''), root);
    expect(root.innerHTML).toBe('<div></div><button>click</button>');

    root.children[1].click();
    await nextTick();
    expect(root.innerHTML).toBe('<p></p><button>click</button>');
  });

  it('should update parent(hoc) component host el when child component self update', async () => {
    const value = ref(true);
    let parentVnode;
    let childVnode1;
    let childVnode2;

    const Parent = {
      render: () => {
        // let Parent first rerender
        return (parentVnode = h(Child,null,''));
      },
    };

    const Child = {
      render: () => {
        return value.value
          ? (childVnode1 = h('div',null,''))
          : (childVnode2 = h('span',null,''));
      },
    };

    render(h(Parent,null,''), root);
    expect(root.innerHTML).toBe(`<div></div>`);
    expect(parentVnode.el).toBe(childVnode1.el);

    value.value = false;
    await nextTick();
    expect(root.innerHTML).toBe(`<span></span>`);
    expect(parentVnode.el).toBe(childVnode2.el);
  });
});