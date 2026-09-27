import { generateColumn } from '../generation/column';
import { greedyMesh } from '../meshing/greedy';
import { meshTransfers, type Job, type JobResult } from './protocol';
const scope = self as unknown as { onmessage: (event: MessageEvent<Job>) => void; postMessage: (data: unknown, transfer: ArrayBuffer[]) => void };
scope.onmessage = ({ data: job }) => {
  try {
    const start = performance.now();
    let result: JobResult, transfer: ArrayBuffer[];
    if (job.kind === 'generate') {
      const chunks = generateColumn(job.config, job.x, job.z, job.edits);
      result = { kind: 'generate', chunks, milliseconds: performance.now() - start };
      transfer = chunks.flatMap(c => [c.data.buffer as ArrayBuffer, ...meshTransfers(c.mesh)]);
    } else {
      const mesh = greedyMesh(job.padded, job.size);
      result = { kind: 'mesh', mesh, milliseconds: performance.now() - start };
      transfer = meshTransfers(mesh);
    }
    scope.postMessage(result, transfer);
  } catch (error) { scope.postMessage({ error: String(error) }, []); }
};
