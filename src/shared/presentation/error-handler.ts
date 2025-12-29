import { Elysia } from "elysia";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	TooManyRequestsError,
	UnauthorizedError,
	ValidationError,
} from "./errors";

// Export error definitions for use in app
export const errorDefinitions = {
	NOTFOUND: NotFoundError,
	BADREQUEST: BadRequestError,
	UNAUTHORIZED: UnauthorizedError,
	VALIDATION_ERROR: ValidationError,
	FORBIDDEN: ForbiddenError,
	TOO_MANY_REQUESTS: TooManyRequestsError,
};

// Export the onError handler function to be used at root level
export const onErrorHandler = ({ error, set, code }: any) => {
	// Handle custom errors (4xx)
	if (
		error instanceof NotFoundError ||
		error instanceof BadRequestError ||
		error instanceof UnauthorizedError ||
		error instanceof ValidationError ||
		error instanceof ForbiddenError ||
		error instanceof TooManyRequestsError ||
		code == "VALIDATION"
	) {
		return error;
	}
	console.error(error);

	// Handle 500 errors
	set.status = 500;
	return Response.json({
		error: "Internal Server Error",
		status: 500,
	});
};

// Plugin for error definitions (can be used in plugins)
export const errorHandler = new Elysia({ name: "errorHandler" }).error(
	errorDefinitions,
);
