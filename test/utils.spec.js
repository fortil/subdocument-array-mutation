const assert = require('assert');
const utils = require('../src/utils');

describe('Testing utils', () => {
  it('getNextId function, should return 4', () => {
    assert.equal(utils.getNextId([{_id: 3}]), 4);
  });
});