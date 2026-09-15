import crypto from 'crypto'
import { Request, Express } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { mkdirSync } from 'fs'
import { extname, join } from 'path'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        const destinationPath = join(
            __dirname,
            process.env.UPLOAD_PATH_TEMP
                ? `../public/${process.env.UPLOAD_PATH_TEMP}`
                : '../public'
        )

        mkdirSync(destinationPath, { recursive: true })

        cb(null, destinationPath)
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        // Генерируем безопасное имя: uuid + расширение из оригинального имени
        const safeExt = extname(file.originalname).toLowerCase().slice(0, 10)
        cb(null, `${crypto.randomUUID()}${safeExt}`)
    },
})

const types = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
]

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    if (!types.includes(file.mimetype)) {
        return cb(null, false)
    }

    return cb(null, true)
}

export default multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 МБ — защита от переполнения
})