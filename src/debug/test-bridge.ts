import { World } from '../world/world';
import { Player } from '../player/controller';
import { Streamer } from '../world/streamer';
import { Renderer } from '../rendering/renderer';
import { Metrics } from './metrics';
import { Input } from '../player/input';
/** Dev-only and explicit ?test flag. Vite eliminates the dynamic import in production. */
export interface TestBridge { world: World; player: Player; stream: Streamer; renderer: Renderer; metrics: Metrics; input: Input }
declare global { interface Window { __origin?: TestBridge } }
export function installTestBridge(bridge: TestBridge): void { window.__origin = bridge; }
