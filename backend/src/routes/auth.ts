import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
    getCurrentUser,
    getCurrentUserRoles,
    login,
    logout,
    refreshAccessToken,
    register,
    updateCurrentUser,
} from '../controllers/auth'
import auth from '../middlewares/auth'
import { generateCsrfToken } from '../middlewares/csrf'
import {
    validateAuthentication,
    validateUserBody,
} from '../middlewares/validations'

const authRouter = Router()

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Слишком много попыток, попробуйте позже' },
})

authRouter.get('/csrf-token', (req, res) => {
    const csrfToken = generateCsrfToken(req, res)
    res.json({ csrfToken })
})

authRouter.get('/user', auth, getCurrentUser)
authRouter.patch('/me', auth, validateUserBody, updateCurrentUser)
authRouter.get('/user/roles', auth, getCurrentUserRoles)
authRouter.post('/login', authLimiter, validateAuthentication, login)
authRouter.post('/token', refreshAccessToken)
authRouter.post('/logout', logout)
authRouter.post('/register', authLimiter, validateUserBody, register)

export default authRouter