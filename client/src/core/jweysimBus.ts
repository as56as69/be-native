/**
 * Event bus مصغّر لجويسم — بلا أي dependancy غير types.
 *
 * حدث واحد أساسي: 'jweysim:interaction' — يُطلق عند أي تفاعل
 * (لمس، إكمال سيناريو، خطأ...). جويسم يسمعه ويسوّي حالته.
 */

export type JweysimInteractionKind =
  | "tap"
  | "scenario-complete"
  | "scenario-error";

export interface JweysimInteractionEvent {
  kind: JweysimInteractionKind;
  /** اختياري: الـ id للنقطة أو القصاصة أو السيناريو. */
  targetId?: string;
  timestamp: number;
}

type JweysimBusEvent = "jweysim:interaction";
type JweysimListener = (event: JweysimInteractionEvent) => void;

const listeners = new Map<JweysimBusEvent, Set<JweysimListener>>();

function emit(event: JweysimBusEvent, payload: JweysimInteractionEvent): void {
  listeners.get(event)?.forEach((listener) => listener(payload));
}

function on(event: JweysimBusEvent, listener: JweysimListener): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(listener);
  return () => off(event, listener);
}

function off(event: JweysimBusEvent, listener: JweysimListener): void {
  listeners.get(event)?.delete(listener);
}

/** اختصار: يبني الحدث بالوقت الحالي ويطلقه. */
function interaction(kind: JweysimInteractionKind, targetId?: string): void {
  emit("jweysim:interaction", { kind, targetId, timestamp: Date.now() });
}

export const jweysimBus = { emit, on, off, interaction };
