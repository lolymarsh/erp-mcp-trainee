/* eslint-disable @typescript-eslint/no-explicit-any */
import { MapEntity, MapEntities, Pick, Omit } from "./map";

describe("MapEntity", () => {
  it("should apply mapper to single entity", () => {
    const entity = { id: "1", name: "test" };
    const result = MapEntity(entity, (e) => ({ label: e.name }));
    expect(result).toEqual({ label: "test" });
  });

  it("should transform type", () => {
    const entity = { x: 1, y: 2 };
    const result = MapEntity(entity, (e) => e.x + e.y);
    expect(result).toBe(3);
  });
});

describe("MapEntities", () => {
  it("should map each item in array", () => {
    const entities = [
      { id: "1", name: "a" },
      { id: "2", name: "b" },
    ];
    const result = MapEntities(entities, (e) => ({ id: e.id }));
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: "1" });
    expect(result[1]).toEqual({ id: "2" });
  });

  it("should return empty array for empty input", () => {
    const result = MapEntities([], (e: any) => e);
    expect(result).toEqual([]);
  });
});

describe("Pick", () => {
  it("should Pick specified keys", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = Pick(obj, ["a", "c"]);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it("should handle missing keys gracefully", () => {
    const obj = { a: 1 } as Record<string, unknown>;
    const result = Pick(obj, ["a", "b"]);
    expect(result).toEqual({ a: 1 });
  });
});

describe("Omit", () => {
  it("should Omit specified keys", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = Omit(obj, ["b"]);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it("should not mutate original object", () => {
    const obj = { a: 1, b: 2 };
    const result = Omit(obj, ["b"]);
    expect(result).toEqual({ a: 1 });
    expect(obj).toEqual({ a: 1, b: 2 });
  });
});
