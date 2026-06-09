export function toTrainingKilo(value) {
  const a1 = 1 / (1000 * (5 / ((value * 5) / 1023) - 1));
  return (2.36111 * Math.exp(1428.01995 * a1)) / 9.81;
}

export function toLegacyTrainingKilo(value) {
  return (5.6 * 10 ** -4 * Math.exp(value / 53.36) + 6.72) / 0.796;
}

export function hasTrainingVibration(sensor, weight, toKilo = toTrainingKilo) {
  const threshold = weight * 0.2;

  for (let i = 0; i < sensor.length; i++) {
    if (toKilo(sensor[i]) > threshold) {
      return true;
    }
  }

  return false;
}
