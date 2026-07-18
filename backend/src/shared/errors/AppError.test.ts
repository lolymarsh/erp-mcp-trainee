import {
  AppError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} from "./AppError";

describe("AppError", () => {
  it("should create with statusCode and message", () => {
    const err = new AppError(400, "Bad request");
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("Bad request");
    expect(err.name).toBe("AppError");
  });

  it("should store details", () => {
    const err = new AppError(409, "Conflict", { field: "name" });
    expect(err.details).toEqual({ field: "name" });
  });
});

describe("NotFoundError", () => {
  it("should have 404 status", () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Resource not found");
  });

  it("should accept custom message", () => {
    const err = new NotFoundError("User not found");
    expect(err.message).toBe("User not found");
  });
});

describe("ConflictError", () => {
  it("should have 409 status", () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe("Conflict");
  });
});

describe("UnauthorizedError", () => {
  it("should have 401 status", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe("Unauthorized");
  });
});

describe("ForbiddenError", () => {
  it("should have 403 status", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe("Forbidden");
  });
});

describe("BadRequestError", () => {
  it("should have 400 status", () => {
    const err = new BadRequestError();
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("Bad request");
  });
});
