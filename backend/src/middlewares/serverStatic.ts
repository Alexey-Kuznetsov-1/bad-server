import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

export default function serveStatic(baseDir: string) {
    const resolvedBase = path.resolve(baseDir)

    return (req: Request, res: Response, next: NextFunction) => {
        // Определяем полный путь к запрашиваемому файлу
        const filePath = path.resolve(resolvedBase, `.${req.path}`)

        // Защита от Path Traversal: файл должен быть внутри resolvedBase
        if (
            filePath !== resolvedBase &&
            !filePath.startsWith(resolvedBase + path.sep)
        ) {
            return next()
        }

        // Проверяем, существует ли файл
        fs.access(filePath, fs.constants.F_OK, (accessErr) => {
            if (accessErr) {
                // Файл не существует отдаем дальше мидлварам
                return next()
            }
            // Файл существует, отправляем его клиенту
            return res.sendFile(filePath, (sendErr) => {
                if (sendErr) {
                    next(sendErr)
                }
            })
        })
    }
}