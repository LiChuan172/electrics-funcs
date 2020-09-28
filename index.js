import { rootMeanSquare, min } from "simple-statistics"
import { zipWith, zip } from "ramda"

const { acos, PI, sqrt, sin } = Math

// FS stands for freqency of sampling
const FS = 1500

const toDegree = (radian) => (radian * 180) / PI
const angleFromSides = (a, b, c) =>
  acos((b * b + c * c - a * a) / (2 * b * c))
const zip3With = (f, dataA, dataB, dataC) =>
  zipWith(
    ([a, b], c) => f(a, b, c),
    zip(dataA, dataB),
    dataC
  )

export function getPhases(Ia, Ib, Ic) {
  const alph1 = angleFromSides(Ib, Ia, Ic)
  const alph2 = angleFromSides(Ic, Ia, Ib)
  const ph1 = PI + alph2
  const ph2 = PI - alph1
  return [ph1, ph2]
}

export function getPhaseDifs(Ia, Ib, Ic) {
  const [ph1, ph2] = getPhases(Ia, Ib, Ic)
  const Q1 = toDegree(ph1)
  const Q2 = toDegree(ph2)

  const phAB = 360 - Q1
  const phBC = Q1 - Q2
  const phCA = Q2

  return [phAB, phBC, phCA]
}

export function getRMS(sample) {
  return rootMeanSquare(sample)
}

export function getAmplitude(sample) {
  const rms = getRMS(sample)
  return toPeak(rms)
}

export function toPeak(rms) {
  return rms * sqrt(2)
}

export function getCurrentFunc(amplitude, f, ph) {
  return (t) => amplitude * sin(2 * PI * f * t + ph)
}

export function getCurrentFunc50Hz(amplitude, ph) {
  return getCurrentFunc(amplitude, 50, ph)
}

export function getPark(dataA, dataB, dataC) {
  const N = min(
    [dataA, dataB, dataC].map((data) => data.length)
  )

  const amplitudes = [dataA, dataB, dataC].map((data) =>
    getAmplitude(data.slice(0, N))
  )

  const [funcA, funcB, funcC] = zipWith(
    getCurrentFunc50Hz,
    amplitudes,
    [0, ...getPhases(...amplitudes)]
  )

  const [dataASmp, dataBSmp, dataCSmp] = [
    funcA,
    funcB,
    funcC,
  ].map((func) =>
    Array(N)
      .fill(0)
      .map((_, index) => func(index / FS))
  )

  return zip3With(
    (a, b, c) => [
      (2.0 / 3.0) * (a - 0.5 * b - 0.5 * c),
      (2.0 / 3.0) *
        ((sqrt(3.0) / 2.0) * b - (sqrt(3.0) / 2.0) * c),
    ],
    dataASmp,
    dataBSmp,
    dataCSmp
  )
}
