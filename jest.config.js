module.exports = {
  automock: false,
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
  },
  preset: 'ts-jest/presets/js-with-babel',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/lib/', '/node_modules/'],
  testRegex: '/__tests__/.*.spec.ts[x]?$',
  transformIgnorePatterns: [
    '/node_modules/(?!(@jupyter(lab|-widgets)/.*|htmlparser2|domhandler|domutils|dom-serializer|domelementtype|entities)/)',
  ],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
};
