import { calculatePagination } from "./handler";

describe("calculatePagination", () => {
  it("should calculate page 1 of 5 with 100 total", () => {
    const result = calculatePagination(1, 20, 100);
    expect(result).toEqual({
      page: 1,
      pageSize: 20,
      totalData: 100,
      totalPage: 5,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it("should calculate last page", () => {
    const result = calculatePagination(5, 20, 100);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(true);
    expect(result.totalPage).toBe(5);
  });

  it("should handle single page", () => {
    const result = calculatePagination(1, 20, 5);
    expect(result.totalPage).toBe(1);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(false);
  });

  it("should handle partial last page", () => {
    const result = calculatePagination(1, 20, 25);
    expect(result.totalPage).toBe(2);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPreviousPage).toBe(false);
  });

  it("should handle zero data", () => {
    const result = calculatePagination(1, 20, 0);
    expect(result.totalData).toBe(0);
    expect(result.totalPage).toBe(0);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(false);
  });
});
