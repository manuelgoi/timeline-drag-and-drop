import { type Ref } from 'vue'
import { ElementSide } from '@/index'
import * as wasi from 'node:wasi'

export function generateRandomObject(maxKeys: number): Record<number, number[]> {
  const result: Record<number, number[]> = {}

  for (let i = 1; i <= maxKeys; i++) {
    const key = i
    const arrayLength = Math.floor(Math.random() * 10) + 1 // Longitud aleatoria entre 1 y 10
    const uniqueValues = generateUniqueValues(arrayLength, 1, 10)
    result[key] = uniqueValues
  }

  return result
}

export function generateRandomArray(maxKeys: number, cols: number): unknown[][] {
  const result = []

  for (let i = 1; i <= maxKeys; i++) {
    const key = i
    const arrayLength = Math.floor(Math.random() * cols) + 1
    const uniqueValues = generateUniqueValues(arrayLength, 0, cols)
    const row = Array.from({ length: cols }, (_, i) => (uniqueValues.includes(i) ? i : null))
    result.push(row)
  }

  return result
}

export function generateRandomCollection(
  maxKeys: number,
  cols: number
): { id: string; value: number | null; row: number; col: number }[] {
  const result = []

  for (let i = 0; i <= maxKeys; i++) {
    const key = i
    const arrayLength = Math.floor(Math.random() * cols) + 1
    const uniqueValues = generateUniqueValues(arrayLength, 0, cols)
    const row = Array.from({ length: cols }, (_, x) => {
      return {
        id: crypto.randomUUID(),
        row: i,
        col: x,
        value: uniqueValues.includes(x) ? x : null
      }
    })
    result.push(row)
  }

  return result.flat()
}

function generateUniqueValues(length: number, min: number, max: number): number[] {
  const values = new Set<number>()

  while (values.size < length) {
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min
    values.add(randomNumber)
  }

  return Array.from(values)
}

export function rndNum(max: number, min: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateSequentialObject(end: number): Record<number, number[]> {
  const result: Record<number, number[]> = {}
  const array = Array.from({ length: 10 }, (_, i) => i + 1)

  for (let i = 1; i <= end; i++) {
    result[i] = array
  }

  return result
}

function createLinkBetweenStops(
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
      setTimeout(() => {
        if (refLink.value) {
          refLink.value.classList.add('show-link')
        }
      }, 200)
    }
  }
}

export function hideLinkBetweenStops(refLink: Ref<HTMLDivElement | null>) {
  if (refLink.value) {
    refLink.value.classList.remove('show-link')
    refLink.value.style.width = '0px'
    refLink.value.style.top = '0px'
    refLink.value.style.left = '0px'
  }
}

export function highlighStopInMyRightSide(
  closestContainer: HTMLElement | null,
  refLink: Ref<HTMLDivElement | null>,
  overRect: DOMRect | null
): HTMLElement | null {
  const currentSiblingStop =
    (closestContainer?.querySelector('[data-label="stop"]') as HTMLElement) ?? null
  currentSiblingStop?.classList?.add('move-to-right')
  const siblingRect = currentSiblingStop?.getBoundingClientRect() ?? null
  createLinkBetweenStops(refLink, overRect, siblingRect)
  return currentSiblingStop
}

export function highlighToTheEndOfMyRightSide(
  refElement: HTMLElement | null,
  refLink: Ref<HTMLDivElement | null>,
  overRect: DOMRect | null,
  padding: number
) {
  const cellRect = refElement?.getBoundingClientRect() ?? null
  const rightRect = {
    left: cellRect?.right ? cellRect.right - padding : 0
  } as DOMRect
  createLinkBetweenStops(refLink, overRect, rightRect)
}

export function highlighStopInMyLeftSide(
  closestContainer: HTMLElement | null,
  refLink: Ref<HTMLDivElement | null>,
  overRect: DOMRect | null
): HTMLElement | null {
  const currentSiblingStop =
    (closestContainer?.querySelector('[data-label="stop"]') as HTMLElement) ?? null
  currentSiblingStop?.classList?.add('move-to-left')
  const siblingRect = currentSiblingStop?.getBoundingClientRect() ?? {
    right: 0,
    top: overRect?.top,
    height: overRect?.height
  }
  createLinkBetweenStops(refLink, siblingRect, overRect)
  return currentSiblingStop
}

export function highlighToTheEndOfMyLeftSide(
  refElement: HTMLElement | null,
  refLink: Ref<HTMLDivElement | null>,
  overRect: DOMRect | null,
  padding: number
) {
  const cellRect = refElement?.getBoundingClientRect() ?? null
  const leftRect = {
    right: cellRect?.left ? cellRect.left + padding : 0,
    top: overRect?.top,
    height: overRect?.height
  } as DOMRect
  createLinkBetweenStops(refLink, leftRect, overRect)
}

export function highlisghtStops(
  leftContainer: HTMLElement | null,
  rightContainer: HTMLElement | null,
  refLink: Ref<HTMLDivElement | null>
) {
  const leftStop = (leftContainer?.querySelector('[data-label="stop"]') as HTMLElement) ?? null
  leftStop?.classList?.add('move-to-left')
  const rightStop = (rightContainer?.querySelector('[data-label="stop"]') as HTMLElement) ?? null
  rightStop?.classList?.add('move-to-left')
  const leftRect = leftStop?.getBoundingClientRect()
  const rightRect = rightStop?.getBoundingClientRect()
  createLinkBetweenStops(refLink, leftRect, rightRect)
  return { leftStop, rightStop }
}

export function isChildVisible(parent: HTMLElement | null, child: HTMLElement | null): boolean {
  if (parent && child) {
    const parentRect = parent.getBoundingClientRect()
    const childRect = child.getBoundingClientRect()

    const isVisible =
      childRect.bottom > parentRect.top &&
      childRect.top < parentRect.bottom &&
      childRect.right > parentRect.left &&
      childRect.left < parentRect.right

    return isVisible
  }
  return false
}

export function cleanStopsHighlighted(
  overStop: HTMLElement | null,
  siblingStop: HTMLElement | null,
  refLink: HTMLDivElement | null
) {
  if (overStop) {
    overStop.classList.remove('move-to-left', 'move-to-right')
  }
  if (siblingStop) {
    siblingStop.classList.remove('move-to-left', 'move-to-right')
  }
  if (refLink) {
    refLink.classList.remove('show-link')
  }
}

export function getSide(x: number, rect: DOMRect | null): ElementSide {
  const left = rect?.left ?? 0
  const width = rect?.width ?? 0
  return x > left + width / 2 ? ElementSide.right : ElementSide.left
}

/*
 * Quizas se pueda mejorar el sistema para aplicar el shadow solo en las que son
 * visibles dentro del timeline
 */
export function shadowAllStopsExcept(excludeIds: (string | undefined)[]) {
  const allStops = document.querySelectorAll("[data-label='stop']")
  allStops.forEach((stop) => {
    if (excludeIds.includes(stop?.id)) {
      stop.classList.remove('shadow')
    } else {
      stop.classList.add('shadow')
    }
  })
}

export function removeAllShadowStops() {
  const allStops = document.querySelectorAll("[data-label='stop']")
  allStops.forEach((stop) => {
    stop.classList.remove('shadow')
  })
}

export function removeAllSelectedStop() {
  const allStops = document.querySelectorAll('.move-to-left, .move-to-right')
  allStops.forEach((stop) => {
    stop.classList.remove('move-to-left')
    stop.classList.remove('move-to-right')
  })
}

export function getClosestLeftElement(
  currentOverContainer: HTMLElement | null
): HTMLElement | null {
  let closestElement: HTMLElement | null = parent(currentOverContainer)
    ?.previousElementSibling as HTMLElement
  while (
    child(closestElement)?.dataset?.hasStops === 'false' &&
    child(closestElement)?.dataset?.row === currentOverContainer?.dataset?.row
  ) {
    closestElement = closestElement?.previousElementSibling as HTMLElement
  }

  return child(closestElement)?.dataset?.row === currentOverContainer?.dataset?.row
    ? child(closestElement)
    : null
}

export function parent(node: HTMLElement | null): HTMLElement | null {
  return node?.parentElement ?? null
}

export function child(node: HTMLElement | null, nodeName: string = 'cell'): HTMLElement | null {
  return (node?.querySelector(`[data-label='${nodeName}']`) as HTMLElement) ?? null
}
export function getClosestRightElement(
  currentOverContainer: HTMLElement | null
): HTMLElement | null {
  let closestElement: HTMLElement | null = parent(currentOverContainer)
    ?.nextElementSibling as HTMLElement
  while (
    child(closestElement)?.dataset?.hasStops === 'false' &&
    child(closestElement)?.dataset?.row === currentOverContainer?.dataset?.row
  ) {
    closestElement = closestElement.nextElementSibling as HTMLElement
  }

  return child(closestElement)?.dataset?.row === currentOverContainer?.dataset?.row
    ? child(closestElement)
    : null
}

export function isInZone(
  containerRect: DOMRect | null,
  draggableX: number,
  draggableY: number,
  zoneHeight: number
) {
  if (containerRect) {
    const { left, top, width, height } = containerRect
    const zoneTop = top + height / 2 - zoneHeight / 2 // Centra la zona verticalmente
    const zoneBottom = zoneTop + zoneHeight // Altura de la zona
    const isInZoneHorizontally = draggableX >= left && draggableX <= left + width
    const isInZoneVertically = draggableY >= zoneTop && draggableY <= zoneBottom

    return isInZoneHorizontally && isInZoneVertically
  }
  return false
}

export function isMouseInsideContainer(containerRect: DOMRect, mouseX: number, mouseY: number) {
  return (
    mouseX >= containerRect.left &&
    mouseX <= containerRect.right &&
    mouseY >= containerRect.top &&
    mouseY <= containerRect.bottom
  )
}
