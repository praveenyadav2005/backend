class apiError extends Error {
    constructor(message="Something went wrong", statusCode,errors=[],stack="") {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.data = null;
        this.success = false;
        if(stack) this.stack = stack;
        else Error.captureStackTrace(this,this.constructor)
    }
}

export {apiError}