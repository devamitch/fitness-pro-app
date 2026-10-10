/** @type {import('@babel/core').TransformOptions} */
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./app",
            "@/components": "./app/components",
            "@/screens": "./app/screens",
            "@/hooks": "./app/hooks",
            "@/utils": "./app/utils",
            "@/services": "./app/services",
            "@/stores": "./app/stores",
            "@/theme": "./app/theme",
            "@/assets": "./app/assets",
            "@/types": "./app/types",
            "@/navigators": "./app/navigators",
            "@/contexts": "./app/contexts",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  }
}
