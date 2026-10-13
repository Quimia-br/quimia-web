import { describe, expect, it, vi } from "vitest";
import { withFinally } from "./withFinally";

describe("withFinally", () => {
  it("returns the result and cleans up exactly once", async () => {
    const cleanup = vi.fn();
    await expect(withFinally(async () => 42, cleanup)).resolves.toBe(42);
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("preserves the rejection and cleans up after failure", async () => {
    const cleanup = vi.fn();
    const error = new Error("Falha no envio");
    await expect(withFinally(async () => { throw error; }, cleanup)).rejects.toBe(error);
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("keeps the lock until the asynchronous work settles", async () => {
    let release!: () => void;
    const cleanup = vi.fn();
    const task = withFinally(() => new Promise<void>(resolve => { release = resolve; }), cleanup);
    expect(cleanup).not.toHaveBeenCalled();
    release();
    await task;
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
