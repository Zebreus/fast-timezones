module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  plugins: ["import", "@typescript-eslint"],
  rules: {
    "react-hooks/exhaustive-deps": "off",
    "no-undef": "off",
    "no-unused-vars": ["off", { ignoreRestSiblings: true }],

    // Import styling
    "import/first": "error",
    "import/no-duplicates": ["error", { considerQueryString: true }],
    "import/no-namespace": "error",
    "import/extensions": ["error", "always", { js: "never", jsx: "never", ts: "never", tsx: "never" }],
    "import/order": [
      "error",
      {
        groups: [["index", "internal", "external"], "parent", "sibling", "builtin"],
        alphabetize: { order: "asc", caseInsensitive: true },
      },
    ],
    "import/newline-after-import": "error",
    "import/max-dependencies": ["error", { max: 10 }], //max should be reduced
    "import/no-anonymous-default-export": "error",

    //Static import analysis
    "import/no-unresolved": "error",
    "import/named": "off",
    "import/default": "error",
    "import/namespace": "error",
    "import/no-dynamic-require": "error",
    "import/no-self-import": "error",
    "import/no-useless-path-segments": ["error", { noUselessIndex: true }],
    "import/no-relative-packages": "error",

    "import/export": "error",
    "import/no-unused-modules": "error",
    "import/no-deprecated": "error",
    "import/no-unused-modules": "error",
    "import/no-named-as-default": "off",
    "import/no-named-as-default-member": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
  },
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: 2018,
    sourceType: "module",
  },
  settings: {
    "import/external-module-folders": ["node_modules", "node_modules/@types"],
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    "import/resolver": {
      node: {
        extensions: [],
      },
    },
  },
}
