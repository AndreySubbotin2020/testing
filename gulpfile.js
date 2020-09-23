const { src, dest, task, series, watch } = require("gulp");
const rm = require( 'gulp-rm' ); //плагин remove oчищаем перед сохранением
const sass = require('gulp-sass'); // плагин sass
const browserSync = require('browser-sync').create(); //Вызываем метод .create() для создания сервера
const reload = browserSync.reload //Перезагрузка
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css'); // Сжимаем файлы Минификация
const sourcemaps = require('gulp-sourcemaps');//Рисует карты css
const svgo = require('gulp-svgo');
const svgSprite = require('gulp-svg-sprite');
const spritesmith = require('gulp.spritesmith');
const gulp = require('gulp');
const fileinclude = require('gulp-file-include'); 
const imagemin = require('gulp-imagemin');

// Указываем компилятору имеено на node.js
sass.compiler = require('node-sass'); 

//очищаем папку dist после каждого изменения для последующего сохранения 
task('clean', () => {
    return src("dist/**/*", { read: false}).pipe(rm());
});

//Собираем файлы html в 1 include
task('html', () => {
    return gulp.src('./src/html/*.html')
    .pipe(fileinclude({prefix: '@@'}))
    .pipe(gulp.dest('./dist/'))
});

//Копируем готовые файлы
 task("copy:html", () => {
    return src('src/**/*.html')
    .pipe(dest("./dist/"))
    .pipe(reload({stream: true}));
 });

 task("copy:fonts", () => {
    return src('src/fonts/**/*.{ttf,otf,eot,woff}')
    .pipe(dest("./dist/fonts/"))
    .pipe(reload({stream: true}));
 });
 
//Обрабатываем sass - минификация
 task("sass", () => { 
    return src('src/sass/*.sass') // обрабатываем массив
    .pipe(sourcemaps.init()) //  инициализируем файлы
    .pipe(sassGlob()) // Импорт файлов
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer(
        {overrideBrowserslist:
             ['last 4 versions'] })) 
    .pipe(cleanCSS()) // Сжимаем файлы Минификация
    .pipe(sourcemaps.write('.')) 
    .pipe(dest("dist/")) // Положили в папку
    .pipe(reload({stream: true})); // Перезагрузили только стили
 });

 //Исходный css
 task("css", () => {
    return src('src/sass/*.sass')
    .pipe(sassGlob()) // Импорт файлов
    .pipe(sass().on('error', sass.logError))
    .pipe(dest("./dist/css/sourse_css")) // Положили в папку
    .pipe(reload({stream: true})); 
 });

 //Обрабатываем svg sprite
 task("svgSprite", () => {
     return src('src/images/icons/*.svg')
     .pipe(
         svgo({
         plagins: [
             {
                 removeAttrs: {attrs: "(fill|stroke|style|width|height|data.*)" }
             }
         ]
     })
    )
     .pipe(svgSprite({
       mode: {
           symbol: {
            sprite: "../sprite.svg"
           }
       }
    }))
    .pipe(dest("./dist/images/sprite/")); 
 });

 //Генерация png sprite_icons(sprite)
 gulp.task('sprite_icons', function () {
    const spriteData = gulp.src('./src/icons/**/*.png')
      .pipe(spritesmith({
      imgName: 'sprite_icons.png',
      cssName: 'sprite.css'
    }));
    return spriteData.pipe(gulp.dest('./dist/sprite/'));
  });

 //Генерация png sprite_img (sprite)
  gulp.task('sprite_img', function () {
    const spriteData = gulp.src('./src/images/**/*.png')
      .pipe(spritesmith({
      imgName: 'sprite_img.png',
      cssName: 'sprite.css'
    }));
    return spriteData.pipe(gulp.dest('./dist/sprite/'));
  });

  //Сжимаем img
  gulp.task('image_min', function () {
    return gulp.src("src/images/**/*")
        .pipe(imagemin())
        .pipe(gulp.dest("./dist/images/"));
});

 //Сжимаем icons
gulp.task('icons_min', function () {
  return gulp.src("src/icons/**/*")
      .pipe(imagemin())
      .pipe(gulp.dest("./dist/icons/"));
});

 //browser-sync запуск сервера
 task('server', () => {
    browserSync.init({
        server: {
            baseDir: "./dist",
            directory: true //Указываем директорию где обрабатываются наши файлы
        }  
    });  
});

 //метод watch следит за изменениями в файлах sass
 // При изменении перезапускает
 watch('./src/**/*.sass', series("sass", "css")); 
 watch('src/**/*.html', series("html", "copy:html")); 
 watch('./src/images/icons/*.svg', series("svgSprite")); 
 watch('src/fonts/**/*.{ttf,otf}', series("copy:fonts")); 

 // Запуск по дефолту соблюдаем последовательность выполняемых  задач
 task("default", series("clean", "html", "copy:html", "sass", "css", "copy:fonts", "svgSprite", "server"));
 gulp.task('default', gulp.parallel( "server", "sprite_icons", "sprite_img", "image_min", "icons_min"));
