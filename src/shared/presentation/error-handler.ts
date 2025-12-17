import { Elysia } from "elysia";
import {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

export const errorHandler = new Elysia({ name: "errorHandler" }).error({
  NOTFOUND: NotFoundError,
  BADREQUEST: BadRequestError,
  UNAUTHORIZED: UnauthorizedError,
  VALIDATION_ERROR: ValidationError,
});
// .onError(({ code, error }) => {
//   if (code === "VALIDATION") {
//     // build your own envelope
//     console.log(error);

//     return {
//       ok: false,
//       code: "INVALID_PAYLOAD",
//       fields: error.all.map((e) => ({
//         field: e.path,
//         reason: e.message,
//       })),
//     };
//   }
// });
