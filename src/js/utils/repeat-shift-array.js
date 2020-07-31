function repeatShift(array, direction = 'left') {
  if (array === undefined) return;
  if (direction === 'left') {
    let first = array.shift();
    array.push(first);
  } else if (direction === 'right') {
    let last = array.pop();
    array.unshift(last)
  }
  else console.log('wrong direction: ' + direction);
}

module.exports = repeatShift;
