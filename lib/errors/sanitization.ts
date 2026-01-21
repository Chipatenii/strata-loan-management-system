/**
 * Sensitive field names that should be redacted from logs
 * DO NOT log PII, KYC documents, payment proofs, or account details
 */
const SENSITIVE_FIELDS = new Set([
    // Document URLs
    'id_document_url',
    'proof_of_address_url',
    'collateral_image_urls',
    'payment_proof_url',

    // Personal Information
    'phone_number',
    'phone',
    'email',
    'full_name',
    'name',

    // Financial Information
    'account_number',
    'bank_name',
    'mobile_money_number',
    'network',

    // Authentication
    'password',
    'token',
    'secret',
    'api_key',
    'service_role_key',

    // IDs (keep requestId, but redact user/business IDs in some contexts)
    'user_id',
    'id',
])

/**
 * Recursively sanitizes an object by redacting sensitive fields
 */
export function sanitizeForLogging(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeForLogging(item))
    }

    // Handle objects
    if (typeof obj === 'object') {
        const sanitized: Record<string, any> = {}

        for (const [key, value] of Object.entries(obj)) {
            // Redact sensitive fields
            if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
                sanitized[key] = '[REDACTED]'
            } else {
                sanitized[key] = sanitizeForLogging(value)
            }
        }

        return sanitized
    }

    // Primitive values
    return obj
}

/**
 * Redacts sensitive data from error meta before logging
 */
export function sanitizeErrorMeta(meta: Record<string, any> | undefined): Record<string, any> | undefined {
    if (!meta) return undefined
    return sanitizeForLogging(meta)
}
