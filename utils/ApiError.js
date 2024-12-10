// utils/ApiError.js
class ApiError extends Error {
    constructor(
        status,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.statusCode = status; // Corrected: should assign status to statusCode
        this.data = null;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

module.exports = ApiError; // Ensure this is correct
