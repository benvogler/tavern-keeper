export function respond(statusCode, body, callback, headers={}) {
    const response = {
        'headers': {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true, // Required for cookies, authorization headers with HTTPS
            ...headers
        },
        'isBase64Encoded': false,
        'body': JSON.stringify(body),
        'statusCode': statusCode
    }
    callback(null, response);
}