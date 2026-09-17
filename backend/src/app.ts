import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import mongoose from 'mongoose'
import path from 'path'
import { DB_ADDRESS, ORIGIN_ALLOW } from './config'
import { doubleCsrfProtection } from './middlewares/csrf'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()

app.set('trust proxy', 1)

app.use(helmet())
app.use(cookieParser())

app.use(
    cors({
        origin: ORIGIN_ALLOW,
        credentials: true,
    })
)

app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', ORIGIN_ALLOW)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    next()
})

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Слишком много запросов, попробуйте позже' },
})

app.use(serveStatic(path.join(__dirname, 'public')))

app.use(urlencoded({ extended: false, limit: '100kb' }))
app.use(json({ limit: '1mb' }))

app.use(mongoSanitize())
app.use(doubleCsrfProtection)

app.use(apiLimiter)
app.use(routes)
app.use(errors())
app.use(errorHandler)

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()