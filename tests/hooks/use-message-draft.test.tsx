import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { useMessageDraft } from "@/hooks/use-message-draft";

function pendingSend() {
  let resolve!: () => void;
  const promise = new Promise<void>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

afterEach(cleanup);

describe("useMessageDraft", () => {
  it("locks synchronously so a same-tick send and edit cannot replace the in-flight draft", async () => {
    const pending = pendingSend();
    const messages: string[] = [];
    const { result } = renderHook(() =>
      useMessageDraft({
        defaultValue: "Original",
        blocked: false,
        onSend: async (message) => {
          messages.push(message);
          await pending.promise;
        },
      }),
    );
    let accepted: Promise<boolean> | undefined;
    let duplicate: Promise<boolean> | undefined;
    act(() => {
      accepted = result.current.send("  Original  ");
      duplicate = result.current.send("Duplicate");
      result.current.change("Edited while locked");
    });
    expect(await duplicate).toBe(false);
    expect(messages).toEqual(["Original"]);
    expect(result.current.value).toBe("Original");
    expect(result.current.sending).toBe(true);
    await act(async () => {
      pending.resolve();
      expect(await accepted).toBe(true);
    });
    expect(result.current.value).toBe("");
    expect(result.current.sending).toBe(false);
    act(() => result.current.change("Next message"));
    expect(result.current.value).toBe("Next message");
  });

  it("requests controlled changes without replacing the value supplied by its parent", async () => {
    const changes: string[] = [];
    const { result, rerender } = renderHook(
      ({ value }) =>
        useMessageDraft({
          value,
          blocked: false,
          onSend: () => {},
          onValueChange: (next) => changes.push(next),
        }),
      { initialProps: { value: "Parent value" } },
    );
    act(() => result.current.change("Requested edit"));
    expect(changes).toEqual(["Requested edit"]);
    expect(result.current.value).toBe("Parent value");
    rerender({ value: "Accepted edit" });
    await act(async () => {
      expect(await result.current.send("Accepted edit")).toBe(true);
    });
    expect(changes).toEqual(["Requested edit", ""]);
    expect(result.current.value).toBe("Accepted edit");
  });

  it("reports acceptance to its caller after unmount without updating a controlled draft", async () => {
    const pending = pendingSend();
    const changed = vi.fn<(value: string) => void>();
    const { result, unmount } = renderHook(() =>
      useMessageDraft({
        value: "Original",
        blocked: false,
        onSend: () => pending.promise,
        onValueChange: changed,
      }),
    );
    let accepted: Promise<boolean> | undefined;
    act(() => {
      accepted = result.current.send("Original");
    });
    unmount();
    pending.resolve();
    expect(await accepted).toBe(true);
    expect(changed).not.toHaveBeenCalled();
  });

  it("returns rejection and unlocks after failure so an edit can dismiss the error and retry", async () => {
    let failing = true;
    const { result } = renderHook(() =>
      useMessageDraft({
        defaultValue: "Original",
        blocked: false,
        onSend: () => {
          if (failing) throw new Error("Private failure");
        },
      }),
    );
    await act(async () => {
      expect(await result.current.send("Original")).toBe(false);
    });
    expect(result.current.error).toMatch(/não foi possível enviar/i);
    expect(result.current.error).not.toContain("Private failure");
    expect(result.current.sending).toBe(false);
    act(() => result.current.change("Retry"));
    expect(result.current.error).toBeNull();
    failing = false;
    await act(async () => {
      expect(await result.current.send("Retry")).toBe(true);
    });
    expect(result.current.value).toBe("");
  });

  it.each([
    { text: "   ", blocked: false, maxLength: 10 },
    { text: "Hello", blocked: true, maxLength: 10 },
    { text: " Hello ", blocked: false, maxLength: 5 },
  ])(
    "returns false without sending invalid input ($text, blocked=$blocked)",
    async ({ text, blocked, maxLength }) => {
      const messages: string[] = [];
      const { result } = renderHook(() =>
        useMessageDraft({
          defaultValue: "Keep",
          blocked,
          maxLength,
          onSend: (message) => {
            messages.push(message);
          },
        }),
      );
      await act(async () => {
        expect(await result.current.send(text)).toBe(false);
      });
      expect(messages).toEqual([]);
      expect(result.current.value).toBe("Keep");
      expect(result.current.sending).toBe(false);
    },
  );
});
