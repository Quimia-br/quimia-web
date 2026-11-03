import { describe, expect, it } from "vite-plus/test";
import { parseProductId } from "@/utils/route-params";

describe("product route parameter", () => {
  it.each([undefined, "", "0", "-1", "1.2", "01", "1e2", "abc", "2147483648"])(
    "rejects %s before it can reach a service",
    (value) => {
      expect(parseProductId(value)).toBeNull();
    },
  );
  it.each(["1", "42", "2147483647"])("accepts %s", (value) => {
    expect(parseProductId(value)).toBe(Number(value));
  });
});
