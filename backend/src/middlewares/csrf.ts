import { doubleCsrf } from 'csrf-csrf'
import type { Request } from 'express'

const {
    generateCsrfToken,
    doubleCsrfProtection,
} = doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET || 'csrf-secret-dev',
    getSessionIdentifier: (req: Request) => req.ip ?? 'anonymous',
    cookieName: '_csrf',
    cookieOptions: {
        httpOnly: false,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    getCsrfTokenFromRequest: (req: Request) =>
        (req.headers['x-csrf-token'] as string) || '',
})

export { generateCsrfToken, doubleCsrfProtection }