export function generateRandomObject(maxKeys: number): Record<number, number[]> {
  const result = {}

  for (let i = 1; i <= maxKeys; i++) {
    const key = i
    const arrayLength = Math.floor(Math.random() * 10) + 1 // Longitud aleatoria entre 1 y 10
    const uniqueValues = generateUniqueValues(arrayLength, 1, 10)
    result[key] = uniqueValues
  }

  return result
}

function generateUniqueValues(length: number, min: number, max: number): number[] {
  const values = new Set<number>()

  while (values.size < length) {
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min
    values.add(randomNumber)
  }

  return Array.from(values)
}

export function generateSequentialObject(end: number): Record<number, number[]> {
  const result: Record<number, number[]> = {}
  const array = Array.from({ length: 10 }, (_, i) => i + 1)

  for (let i = 1; i <= end; i++) {
    result[i] = array
  }

  return result
}
