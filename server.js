const express = require('express');
const expressFileUpload = require('express-fileupload');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');
const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(expressFileUpload({ limits: { fileSize: 5 * 1024 * 1024 } }));

app.set('view engine', 'ejs');



app.get('/', (req, res) => {
    res.render('pages/index', {
        image: null,
        error: null,
    });
})

app.post('/', async (req, res) => {
    try {
        const { image } = req.files;
        const name = image.name
        const mimetype = image.mimetype;
        const sizeBeforeInByte = image.size;
        const bufferData = image.data;

        const sizeBeforeInKiloBytes = Math.round(sizeBeforeInByte / 1024);
        console.log(sizeBeforeInKiloBytes)

        if (sizeBeforeInKiloBytes > 5000) {
            return res.render('pages/index', {
                image: null,
                error: 'File size is bigger than 5MB'
            })
        }
        //image/jpeg
        if (mimetype != 'image/jpeg' && mimetype != 'image/png' && mimetype != 'image/svg+xml') {
            return res.render('pages/index', {
                image: null,
                error: 'We support JPG and PNG only'
            })
        }

        const jpegQuality = sizeBeforeInKiloBytes < 1500 ? 50 : 30;
        const pngQuality = sizeBeforeInKiloBytes < 1500 ? [0.4, 0.6] : [0.2, 0.4];

        const compressedImgBuffer = await imagemin.buffer(bufferData, {
            destination: 'build/images',
            plugins: [
                imageminMozjpeg({ quality: jpegQuality }),
                imageminPngquant({
                    quality: pngQuality
                }),
                imageminSvgo({
                    plugins: [
                        { removeViewBox: false }
                    ]
                })
            ]
        });

        const sizeAfterInKiloBytes = Math.round(compressedImgBuffer.length / 1024)
        console.log(sizeAfterInKiloBytes)

        const base64Img = Buffer.from(compressedImgBuffer).toString('base64');

        return res.render('pages/index', {
            error: null,
            image: {
                name,
                mimetype,
                sizeBefore: `${sizeBeforeInKiloBytes} KB`,
                sizeAfter: `${sizeAfterInKiloBytes} KB`,
                href: `data:${mimetype};base64,${base64Img}`
            }
        })

    } catch (error) {
        console.log(error)
    }
})



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server is running on PORT: ${PORT}`))
