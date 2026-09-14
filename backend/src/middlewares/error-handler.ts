import { ErrorRequestHandler } from 'express'

// eslint-disable-next-line no-unused-vars
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    const statusCode = err.statusCode || 500
    const message =
        statusCode === 500 ? 'На сервере произошла ошибка' : err.message

    // eslint-disable-next-line no-console
    console.error(err)

    res.status(statusCode).send({ message })
}

export default errorHandler