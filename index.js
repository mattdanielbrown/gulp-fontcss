var through2 = require('through2')
var gutil = require('gulp-util')
var path = require('path')

function FontSheet(family, weight, style) {
    this.family = family
    this.weight = weight || 400
    this.style = style || 'normal'
}

FontSheet.prototype.getIdentifierString = function () {
    return this.family + '(' + this.weight + ')(' + this.style + ')';
}

FontSheet._getNumberedWeight = function (info) {
    var w = 400
    if (!info.weight) {
        return w;
    }

    switch (info.weight.toLowerCase()) {
        case 'black': w = 900; break;
        case 'bold': w = 700; break;
        case 'medium': w = 500; break;
        case 'roman': case 'regular': w = 400; break;
        case 'light': w = 300; break;
        case 'thin': w = 200; break;
        default: break
    }

    if (info.climax === 'semi' && w >= 700) { // semibold?
        w -= 100;
    }

    if (info.climax === 'ultra' && w <= 300) { // ultralight?
        w -= 100;
    }

    if ((info.climax === 'ultra' || info.climax === 'extra') && w >= 700) { // ultrabold
        w += 100;
    }

    return w;
};

FontSheet.infer = function(filename, file) {
    var matches, parentdir

    if (filename.indexOf('/') > 0) { // REPL?
        var splitted = filename.split('/')
        filename = splitted[1]
        parentdir = splitted[0]
    }

    else if (file) {
        parentdir = path.basename(path.dirname(file.path))
    }

    const pattern = /^(?:(\w+)\-)?(?:(semi|extra|ultra)?(bold|black|medium|regular|roman|thin|light)?(?:\-?(italic|oblique))?)(?:\-webfont)?\.\w+$/i;

    if (matches = filename.match(pattern)) {
    
        var info = {
            name: matches[1],
            climax: matches[2],
            weight: matches[3],
            style: matches[4]
        }

        if (!info.name) {
            info.name = parentdir
        }

        var family = info.name
        var weight = FontSheet._getNumberedWeight(info)
        var style = info.style || 'normal'

        return new FontSheet(family, weight, style);

    }
}

/**
 * Options:
 * 
 *  - (optional) modifyFontSheet: 
 *      Type:           function (sheet, file) { return sheet; }
 *      Description:    Modifies the font sheet, that was mapped from a file.
 *                      Must return new or modified font sheet.
 *                      
 *  - (optional) map:
 *      Type:           function (filename, file) { return new fontcss.FontSheet(family, weight, style) }
 *      Description:    Maps a file/filename to 
 *      
 *  - (optional) output:
 *      Type:           String
 *      Description:    Output filename beginning.
 *  
 */
function FontCSS (opt) {

    opt = opt || {}

    const extToUrlBegin = {
        "woff": 'data:application/font-woff;charset=utf-8;base64,',
        "woff2": 'data:application/font-woff2;charset=utf-8;base64,',
        "ttf": 'data:application/x-font-truetype;charset=utf-8;base64,',
        "otf": 'data:application/x-font-opentype;charset=utf-8;base64,',
        "svg": 'data:image/svg+xml;charset=utf-8;base64,',
        "eot": 'data:application/vnd.ms-fontobject;charset=utf-8;base64,'
    };

    var files = [], processed = []
    var modifyFontSheet = opt.modifyFontSheet || function (sheet) { return sheet; }
    var outputBase = opt.output || 'fonts'
    var fnToFontSheet = opt.map || FontSheet.infer;

    function createFontFaceFromFile(file) {
        var filename = path.basename(file.path)
        var ext = path.extname(file.path).substring(1)
        var fontdef = fnToFontSheet(filename, file)

        if (fontdef) {

            fontdef = modifyFontSheet(fontdef)

            var fontid = fontdef.getIdentifierString() + '(' + ext + ')'
            if (processed.indexOf(fontid) >= 0) {
                gutil.log('Confused. Already processed', filename, ' Skipping.')
                return 
            }

            if (!(ext in extToUrlBegin)) {
                gutil.log('Unrecognised font type of file', filename, ' Skipping.')
                return 
            }

            var encoded = file.contents.toString('base64')
            var src = 'url(' + extToUrlBegin[ext] + encoded + ')';

            return `@font-face {
    /* ${file.relative} */
    font-family: "${fontdef.family}";
    font-weight: ${fontdef.weight};
    font-style: ${fontdef.style};
    src: ${src};
}`
        }

        else {
            gutil.log('Could not map filename', filename, 'to font info. Skipping. ')
        }
    }

    function createFile(name, ext, contents) {
        return new gutil.File({
          cwd: "",
          base: "",
          path: name + '.' + ext,
          contents: ((contents instanceof Buffer) ? contents : new Buffer(contents))
        })
    }

    // Just collects all input files
    function collect(file, encoding, callback) {
        if (file.isStream() || !file.path) {
            throw 'Streams not supported in font-css';
        }

        files.push(file)

        callback()
    }

    // When ready, spits out collected
    function spit(callback) {
        var sorted = {}

        for (var i = 0; i < files.length; i++) {
            var file = files[i]
            var ext = path.extname(file.path)
            ext = ext.substring(1)

            if (!(ext in sorted)) {
                sorted[ext] = []
            }

            sorted[ext].push(file)
        }

        for (var type in sorted) {
            var string = '';

            for (var i = 0; i < sorted[type].length; i++) {
                var file = sorted[type][i] 
                var ff = createFontFaceFromFile(file)

                if (ff) {
                    string += ff + '\r\n' + '\r\n'
                }
            }

            this.push(createFile(outputBase + '-' + type, 'css', string))
        }

        files = []
        processed = []
        callback()
    }

    // file is supposed to be a font file
    return through2.obj(collect, spit)

};

FontCSS.FontSheet = FontSheet

module.exports = FontCSS