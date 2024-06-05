import { StopSide } from '@/index'
import { ref, type Ref } from 'vue'

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

function createLink(
  refLink: Ref<HTMLDivElement | null>,
  starRect: DOMRect | null,
  endRect: DOMRect | null
) {
  if (starRect && endRect) {
    const startX = starRect.right
    const endX = endRect.left
    const y = starRect.top + starRect.height / 2 - 1
    if (refLink.value) {
      refLink.value.style.top = `${y}px`
      refLink.value.style.left = `${startX}px`
      refLink.value.style.width = `${endX - startX}px`
      refLink.value.classList.add('show-link')
    }
  }
}

export function highlighTwoStopsToRight(
  closestContainer: HTMLElement | null,
  refLink: Ref<HTMLDivElement | null>,
  overRect: DOMRect | null
): HTMLElement | null {
  const currentSiblingStop =
    (closestContainer?.querySelector('[data-label="stop"]') as HTMLElement) ?? null
  currentSiblingStop?.classList?.add('highlight-left')
  const siblingRect = currentSiblingStop?.getBoundingClientRect() ?? null
  createLink(refLink, overRect, siblingRect)
  return currentSiblingStop
}

export function highlighTwoStopsToLeft(
  closestContainer: HTMLElement | null,
  refLink: Ref<HTMLDivElement | null>,
  overRect: DOMRect | null
): HTMLElement | null {
  const currentSiblingStop =
    (closestContainer?.querySelector('[data-label="stop"]') as HTMLElement) ?? null
  currentSiblingStop?.classList?.add('highlight-right')
  const siblingRect = currentSiblingStop?.getBoundingClientRect() ?? null
  createLink(refLink, overRect, siblingRect)
  return currentSiblingStop
}

export function cleanStopsHighlighted(
  overStop: HTMLElement | null,
  siblingStop: HTMLElement | null,
  refLink: HTMLDivElement | null
) {
  if (overStop) {
    overStop.classList.remove('highlight-left', 'highlight-right')
  }
  if (siblingStop) {
    siblingStop.classList.remove('highlight-left', 'highlight-right')
  }
  if (refLink) {
    refLink.classList.remove('show-link')
  }
}

export function getSide(x: number, rect: DOMRect | null): StopSide {
  const left = rect?.left ?? 0
  const width = rect?.width ?? 0
  return x > left + width / 2 ? StopSide.right : StopSide.left
}

export function getClosestLeftElement(
  currentOverContainer: HTMLElement | null
): HTMLElement | null {
  let closestElement: HTMLElement | null =
    currentOverContainer?.previousElementSibling as HTMLElement
  while (
    closestElement?.dataset?.hasStops === 'false' &&
    closestElement?.dataset?.row === currentOverContainer?.dataset?.row
  ) {
    closestElement = closestElement?.previousElementSibling as HTMLElement
  }
  return closestElement
}

export function getClosestRightElement(
  currentOverContainer: HTMLElement | null
): HTMLElement | null {
  let closestElement: HTMLElement | null = currentOverContainer?.nextElementSibling as HTMLElement
  while (
    closestElement?.dataset?.hasStops === 'false' &&
    closestElement?.dataset?.row === currentOverContainer?.dataset?.row
  ) {
    closestElement = closestElement.nextElementSibling as HTMLElement
  }
  return closestElement
}
