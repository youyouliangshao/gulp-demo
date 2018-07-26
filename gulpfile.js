var gulp = require('gulp');
var sass = require('gulp-sass');
var babel = require("gulp-babel");
var minifyHtml = require('gulp-htmlmin');
var fileinclude = require('gulp-file-include');
//压缩css
var cleanCss = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var strip = require('gulp-strip-comments');
var imagemin = require('gulp-imagemin');
var gulpif = require('gulp-if');
var notify = require('gulp-notify');

//gulp-rev为文件名增加hash后缀值，可视开发环境来配置
var rev = require('gulp-rev');
var clean = require('gulp-clean');
var sequence = require('gulp-sequence');
var changed = require('gulp-changed');
var filter = require('gulp-filter');

var srcPath = "src";
var buildPath = "static";

var imageSrcPath = srcPath + "/images/**/*.*";
var imageBuildPath = buildPath + "/images";

var jsSrcPath = srcPath + "/js/**/*.*";
var jsBuildPath = buildPath + "/js";

var cssSrcPath = srcPath + "/css/**/*.*";
var cssBuildPath = buildPath + "/css";

var viewSrcPath = srcPath + "/template/**/*.*";
var viewBuildPath = buildPath + "/template";

function isCompress() {
    //isCompress函数可根据node env获开发环境来配置是否需要压缩
    //process.env.NODE_ENV || 'dev'
    return true;
}

gulp.task('clean', function () {
    return gulp.src([buildPath], {read: false})
        .pipe(clean({force: true}))
        .pipe(notify({
            message: "clean <%= file.path %> directory success",
            notifier: function (options) {
            }
        }));
});

gulp.task('image', function () {
    return gulp.src(imageSrcPath)
        .pipe(changed(imageBuildPath))
        //压缩png jpg svg等图片文件，深度优化压缩png可使用imagemin-pngquant中间件
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(gulp.dest(imageBuildPath))
        .pipe(gulpif(isCompress(), notify({
            message: "compress <%= file.path %> success",
            notifier: function (options) {
            }
        })));
});
gulp.task('js', function () {
    //JS框架lib目录不进行压缩转换等操作
    const f = filter(['**', '!src/js/lib/**/*.*'], {restore: true});
    return gulp.src(jsSrcPath)
        .pipe(changed(jsBuildPath))
        .pipe(f)
        //去掉注释
        .pipe(strip())
        //es6转es5
        .pipe(babel())
        //压缩JS
        .pipe(uglify())
        .pipe(f.restore)
        .pipe(gulp.dest(jsBuildPath))
        .pipe(gulpif(isCompress(), notify({
            message: "compress <%= file.path %> success",
            notifier: function (options) {
            }
        })))
});

gulp.task('css', function () {
    return gulp.src(cssSrcPath)
        .pipe(changed(cssBuildPath))
        //编译sass,输出错误,outputStyle文件输出方式，展开，嵌套，压缩等
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        //压缩编译后的css，本项目为了css后续优化，暂不做css压缩
        //.pipe(cleanCss())
        .pipe(gulp.dest(cssBuildPath))
        .pipe(gulpif(isCompress(), notify({
            message: "compress <%= file.path %> success",
            notifier: function (options) {
            }
        })))
});
gulp.task('html', function () {
    var options = {
        removeComments: true,//清除HTML注释
        collapseWhitespace: false,//压缩HTML
        collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
        //removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
        //removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
        minifyJS: true,//压缩页面JS
        minifyCSS: true//压缩页面CSS
    };
    return gulp.src(viewSrcPath)
        .pipe(fileinclude({
            prefix: '@@',
            basepath: './src/template/components'
        }))
        .pipe(minifyHtml(options))
        .pipe(gulp.dest(viewBuildPath))
        .pipe(gulpif(isCompress(), notify({
            message: "compress <%= file.path %> success",
            notifier: function (options) {
            }
        })));
});
gulp.task('watch', function () {
    gulp.watch(jsSrcPath, ['js']);
    gulp.watch(cssSrcPath, ['css']);
    gulp.watch(imageSrcPath, ['image']);
    gulp.watch(viewSrcPath, ['html']);
});

gulp.task('default', sequence('clean', ['js', 'image', 'css'], 'html'));
