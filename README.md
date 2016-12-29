# gulp-fontcss

This gulp plugin makes it easy for you to transform font files into css files. Css embedded fonts have the advantage, that they serve all fonts in one request rather than splitting things up in multiple requestes, resulting in faster load speeds. In addition, they can be cached and targeted. Read [this guide](https://www.filamentgroup.com/lab/font-loading.html) for more information.

The fonts are embedded into css files via data uris and base64 encoding.

## Installation
```bash
npm install --save-dev gulp-fontcss
```

## Usage
Example of gulpfile:

```javascript
var gulp = require('gulp')
var fontcss = require('gulp-fontcss')

gulp.task('fonts', function () {
    gulp.src('assets/fonts/src/*/*')
        .pipe(fontcss())
        .pipe(gulp.dest('assets/fonts/css'))
})
```

### Specification inference
The problem by using font files is, that a program doesn't know what font actually is represented in the file. gulp-fontcss uses regular expressions to figure out what font-family, font-weight and font-style the file belongs to.

File-names thus play a crucial role. There are currently two file-name formats supported:

1. Solely based on file-name (`montserrat-regular.ttf`, `montserrat-extrabold-webfont.ttf`)
2. Based on parent folder-name and file-name (`montserrat/regular.ttf`, `montserrat/extrabold.ttf`)

These formats are recognised automatically. You just have to structure your files in these ways.
The suffix `-webfont` is always optional and has no meaning.

Some examples:
```bash
$ node
> var fontcss = require('.')
undefined
> fontcss.FontSheet.infer('montserrat/regular-webfont.ttf')
FontSheet { family: 'montserrat', weight: 400, style: 'normal' }
> fontcss.FontSheet.infer('montserrat-extrabold-italic-webfont.ttf')
FontSheet { family: 'montserrat', weight: 800, style: 'italic' }
```
Try for yourself!

### Tips and tricks

1. Use the [FontSquirrel WebFont generator](https://www.fontsquirrel.com/tools/webfont-generator), because it will exactly match the file-names that gulp-fontcss supports!
2. Use a css minifier (such as gulp-clean-css) after gulp-fontcss!
3. On your website, load only the browser-specific font-format ([as described here, a very good guide](https://www.filamentgroup.com/lab/font-loading.html))

### Options

#### Specify your own custom file to specification mapping
```javascript
{
    // This must return a fontcss.FontSheet instance. Look at index.js
    map: function (filename, file) {
        return // whatever.... FontSheet instance.
    }
}
```

#### Modify inferred font specification
```javascript
{
    modifyFontSheet: function (sheet) {
        var family = sheet.family // (string) contains family name of font e.g. Montserrat
        var weight = sheet.weight // (integer) contains weight of font e.g. 300, 400, 700, etc.
        var style = sheet.style // (string) contains style of font e.g. italic

        sheet.family = sheet.family.toUpperCase() // converts family to upper-case

        return sheet // !!! this is important
    }
}
```

#### Set output base name
```javascript
{
    output: 'my-font-file' // output will be e.g. my-font-file-ttf.css
}
```

## License
MIT