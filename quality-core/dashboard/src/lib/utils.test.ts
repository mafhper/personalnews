import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("should merge class names correctly", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });

  it("should handle conditional classes", () => {
    const condition = false;
    const result = cn("class1", condition && "class2", "class3");
    expect(result).toBe("class1 class3");
  });

  it("should handle undefined and null values", () => {
    const result = cn("class1", undefined, null, "class2");
    expect(result).toBe("class1 class2");
  });

  it("should handle empty strings", () => {
    const result = cn("", "class1", "", "class2", "");
    expect(result).toBe("class1 class2");
  });

  it("should handle complex tailwind classes", () => {
    const result = cn(
      "bg-blue-500 hover:bg-blue-600",
      "text-white",
      "px-4 py-2"
    );
    expect(result).toBe("bg-blue-500 hover:bg-blue-600 text-white px-4 py-2");
  });
});
