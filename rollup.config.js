import typescript from "@rollup/plugin-typescript";
import sourceMaps from "rollup-plugin-sourcemaps";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";

export default {
  input:"./src/runtime/tests/index.ts",
  plugins: [

    resolve(),
    commonjs(),
    typescript(),
    sourceMaps(),
  ],
  output: [
    {
      format: "cjs",
      file: "./packages/vue/dist/lbq-mini-vue.cjs.js",
      sourcemap: true,
    },
    {
      name: "vue",
      format: "es",
      file: "./packages/vue/dist/lbq-mini-vue.esm-bundler.js",
      sourcemap: true,
    },
  ],
  onwarn: (msg, warn) => {
    // 忽略 Circular 的错误
    if (!/Circular/.test(msg)) {
      warn(msg);
    }
  },
};
