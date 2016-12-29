var gulp = require('gulp')
var fontcss = require('.')

gulp.src('test-src/*/*')
	.pipe(fontcss({

		modifyFontSheet: function (sheet, file) {
			switch(sheet.family.toLowerCase()) {
				case 'crimsontext': sheet.family = 'Crimson Text'; break;
				default: break;
			}

			return sheet;
		}

	}))
	.pipe(gulp.dest('test-dest'));