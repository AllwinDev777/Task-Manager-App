const pluginSecurity = require('eslint-plugin-security');

module.exports = [
    pluginSecurity.configs.recommended,
    {
        files: ['**/*.js'],
        rules: {
            // 'security/detect-object-injection': 'off',
        },
    },
];