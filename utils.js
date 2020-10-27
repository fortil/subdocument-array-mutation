// get the next number id
module.exports.getNextId = (array) => {
  const findLastIndex = array && array.length ? array.map(a => a._id).reduce((prev, curr) => curr > prev ? curr : prev, 0) : 0;
  return findLastIndex + 1;
}