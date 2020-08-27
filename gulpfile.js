const { src, dest, task, series, watch } = require("gulp");
const rm = require( 'gulp-rm' ); //плагин remove oчищаем перед сохранением
const sass = require('gulp-sass'); // плагин sass
const concat = require('gulp-concat'); //Плагин для склеивания файлов
const browserSync = require('browser-sync').create(); //Вызываем метод .create() для создания сервера
const reload = browserSync.reload //Перезагрузка
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
/* const px2rem = require('gulp-smile-px2rem'); // Переводим в rem */
/* const gcmq = require('gulp-group-css-media-queries'); */
const cleanCSS = require('gulp-clean-css'); // Сжимаем файлы Минификация
const sourcemaps = require('gulp-sourcemaps');//Рисует карты css
const svgo = require('gulp-svgo');
const svgSprite = require('gulp-svg-sprite');
const spritesmith = require('gulp.spritesmith');
const gulp = require('gulp');
const fileinclude = require('gulp-file-include'); 

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
    .pipe(dest("dist"))
    .pipe(reload({stream: true}));
 });

//Подключаем сss зависемые файлы normalize склеиваем 
const styles  = [
    "node_modules/normalize.css/normalize.css",
    "src/styles/main.scss"
];
 
//Обрабатываем стили
 task("styles", () => { 
    return src(styles) // обрабатываем массив
    .pipe(sourcemaps.init()) //  инициализируем файлы
    .pipe(concat('main.scss')) // склеиваем 
    .pipe(sassGlob()) // Импорт файлов
    .pipe(sass().on('error', sass.logError))
    /* .pipe(px2rem()) // переводим в em для адаптива */
    .pipe(autoprefixer(
        {overrideBrowserslist:
             ['last 4 versions'] })) 
    /*.pipe(gcmq())*/  //!с soursmaps! Обьединяем одинаковые по параметрам медиа запросы
    .pipe(cleanCSS()) // Сжимаем файлы Минификация
    .pipe(sourcemaps.write('.')) // 
    .pipe(dest("dist")) // Положили в папку
    .pipe(reload({stream: true})); // Перезагрузили только стили
 });

 //Обрабатываем img 
 task("icons", () => {
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
    .pipe(dest("dist/images/icons")); 
 });

 //Генерация png (sprite)
 gulp.task('sprite', function () {
    var spriteData = gulp.src('./src/images/icons/*.png')
      .pipe(spritesmith({
      imgName: 'sprite.png',
      cssName: 'sprite.css'
    }));
    return spriteData.pipe(gulp.dest('./dist/images/icons/'));
  });
 
 //browser-sync запуск сервера
 task('server', () => {
    browserSync.init({
        server: {
            baseDir: "./dist" //Указываем директорию где обрабатываются наши файлы
        }  
    });  
});

 //метод watch следит за изменениями в файлах ./src/styles/**/*.scss' 
 watch('./src/styles/**/*.scss', series("styles")); // При изменении перезапускает и следит
 watch('src/**/*.html', series("html","copy:html")); 
 watch('./src/images/icons/*.svg', series("icons")); 

 // Запуск по дефолту соблюдаем выполняемых  задач
 task("default", series("clean", "html", "copy:html", "styles", "icons", "server"));
 
 gulp.task('default', gulp.parallel("sprite", "server"));
