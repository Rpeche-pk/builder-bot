import { EventEmitter } from 'node:events'
import { TContext } from '../types'

export type HostEventTypes = {
    send_message: [arg1: TContext & { from: string; answer: string | string[] }]
}

export class TypedEventEmitter<TEvents extends Record<string, any>> {
    private emitter = new EventEmitter()

    emit<TEventName extends keyof TEvents & string>(eventName: TEventName, ...eventArg: TEvents[TEventName]) {
        this.emitter.emit(eventName, ...(eventArg as []))
    }

    on<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        handler: (...eventArg: TEvents[TEventName]) => void
    ) {
        this.emitter.on(eventName, handler as any)
    }

    off<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        handler: (...eventArg: TEvents[TEventName]) => void
    ) {
        this.emitter.off(eventName, handler as any)
    }
}
