/**
 * The form fields the backend refused, from a failed request: `VALIDATION_FAILED` answers with
 * `fields`, the request DTO's own field names (`title`, `logoUrl`…), which the forms use as the
 * `field` of each `Input`. An empty set for any other error, so a form can pass whatever error it
 * last had without first asking what kind it was.
 */
export function rejectedFieldsOf(error) {
    const data = error?.response?.data;
    if (data?.reason !== 'VALIDATION_FAILED' || !Array.isArray(data.fields)) return new Set();
    return new Set(data.fields.filter((name) => typeof name === 'string' && name));
}
