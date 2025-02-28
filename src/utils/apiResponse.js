class apiResponse {
    constructor(data, statusCode, message="success") {
        this.data = data;
        this.statusCode = statusCode;
        this.message = message;
    }
}     
export {apiResponse}