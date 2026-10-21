export const statusCode = {
  success: 200,
  create: 201,
  badRequest: 400,
  unauthorize: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
  internalServerError: 500,
  badGateway: 502,
} as const;

export type StatusCode = (typeof statusCode)[keyof typeof statusCode];
