import { render } from '../render';
import { h, Text, Fragment } from '../vnode';
import {describe,it,beforeEach,expect} from 'vitest'
let root;
beforeEach(() => {
  root = document.createElement('div');
});
const makeNodes = (arr) => {
  return {
    nodes: arr.map((tag) => h(tag,null,'1')),
    html: arr.map((tag) => `<${tag}>1</${tag}>`).join(''),
  };
};

describe('element anchor order check', () => {
  it('tag order', () => {
    let result;
    result = makeNodes(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
    render(h('div', null, result.nodes), root);

    expect(root.children[0].innerHTML).toBe(result.html);

  });
  

  it('tag and text order', () => {
    render(
      h('div', null, [h(Text, null, 'text1'), h('p',null,''), h(Text, null, 'text2')]),
      root
    );
    expect(root.children[0].innerHTML).toBe('text1<p></p>text2');

  });

  it('tag will be more or less', () => {
    let result;
    result = makeNodes(['h1', 'h2', 'h3']);
    render(h('div', null, result.nodes), root);
    expect(root.children[0].innerHTML).toBe(result.html);
  });

  it('tag and text will be more or less', () => {
    render(h('div', null, [h(Text, null, '')]), root);
    render(
      h('div', null, [h('p',null,''), h(Text, null, 'text2'), h(Text, null, 'text1')]),
      root
    );
    expect(root.children[0].innerHTML).toBe('<p></p>text2text1');
  });
});
