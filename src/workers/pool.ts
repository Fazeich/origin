import { type Job, type JobResult } from './protocol';
interface Slot { worker: Worker; busy: boolean; reject?: (error: Error) => void }
export class WorkerPool {
  private readonly slots: Slot[];
  constructor(count: number) {
    this.slots = Array.from({ length: count }, () => ({ worker: new Worker(new URL('./terrain.worker.ts', import.meta.url), { type: 'module' }), busy: false }));
  }
  get available(): boolean { return this.slots.some(s => !s.busy); }
  run(job: Job): Promise<JobResult> {
    const slot = this.slots.find(s => !s.busy);
    if (!slot) throw new Error('Worker capacity exceeded');
    slot.busy = true;
    return new Promise((resolve, reject) => {
      slot.reject = reject;
      slot.worker.onmessage = ({ data }: MessageEvent<JobResult | { error: string }>) => {
        slot.busy = false; slot.reject = undefined;
        if ('error' in data) reject(new Error(data.error)); else resolve(data);
      };
      slot.worker.onerror = event => { slot.busy = false; slot.reject = undefined; reject(new Error(event.message)); };
      slot.worker.postMessage(job, job.kind === 'mesh' ? [job.padded.buffer] : []);
    });
  }
  dispose(): void {
    for (const slot of this.slots) { slot.worker.terminate(); slot.reject?.(new Error('Worker pool disposed')); }
  }
}
