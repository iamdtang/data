import { DEBUG } from '@glimmer/env';

interface Request {}

interface NextFn {
  (request: Request): Promise<unknown>;
}

interface RequestResponse {}

interface Middleware {
  request(request: Request, next: NextFn): Promise<unknown>;
}

const Wares = new WeakMap<RequestManager, Middleware[]>();

function waresFor(manager: RequestManager): Middleware[] {
  let wares = Wares.get(manager);

  if (wares === undefined) {
    wares = [];
    Wares.set(manager, wares);
  }

  return wares;
}

class RequestManager {
  use(ware: Middleware) {
    const wares = waresFor(this);
    if (DEBUG) {
      if (Object.isFrozen(wares)) {
        throw new Error(`Cannot add a Middleware to a RequestManager after a request has been made`);
      }
    }
    wares.push(ware);
  }

  request(request: Request): Promise<RequestResponse> {
    const wares = waresFor(this);
    if (DEBUG) {
      if (!Object.isFrozen(wares)) {
        Object.freeze(wares);
      }
    }
    return perform(wares, request);
  }
}

function perform(wares: Readonly<Middleware[]>, request: Request, i: number = 0): Promise<unknown> {
  if (i === wares.length) {
    throw new Error(`No middleware was able to handle this request.`);
  }
  function next(r: Request): Promise<unknown> {
    return perform(wares, r, i + 1);
  }
  return wares[i].request(request, next);
}
