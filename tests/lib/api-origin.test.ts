import { describe, expect, it } from "vite-plus/test";
import { resolveApiOrigin } from "@/lib/api-origin";

describe("API origin URL boundaries", () => {
  it.each([
    ["  http://127.0.0.1:8080/  ", "http://127.0.0.1:8080"],
    ["HTTPS://API.EXAMPLE.COM:443/", "https://api.example.com"],
    ["http://[::1]:8080/", "http://[::1]:8080"],
  ])("normalizes an HTTP origin %j", (input, expected) => {
    expect(resolveApiOrigin({ VITE_API_URL: input })).toBe(expected);
  });

  it("uses the same-origin proxy when no environment URL exists", () => {
    expect(resolveApiOrigin({})).toBe("");
  });

  it("treats a whitespace-only URL as a same-origin configuration", () => {
    expect(resolveApiOrigin({ VITE_API_URL: " \t " })).toBe("");
  });

  it.each([
    "https://user@api.example.com",
    "https://:secret@api.example.com",
    "https://api.example.com/#private",
  ])("rejects embedded credentials or fragments in %s", (input) => {
    expect(() => resolveApiOrigin({ VITE_API_URL: input })).toThrow();
  });
});
