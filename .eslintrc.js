module.exports = {
    "env": {
        "browser": true,
        "es2020": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 11,
        "sourceType": "module"
    },
    "rules": {
      "no-shadow": 2,
      "no-var": 2,
      "no-unused-vars": 0,
      "prefer-destructuring": 2,
    }
};
