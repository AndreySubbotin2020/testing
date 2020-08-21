const { src, dest, task, series, watch } = require("gulp");
const rm = require( 'gulp-rm' ); //плагин remove oчищаем перед сохранением
const sass = require('gulp-sass'); // плагин sass
const concat = require('gulp-concat'); //Плагин для склеивания файлов
const browserSync = require('browser-sync').create(); //Вызываем метод .create() для создания сервера
const reload = browserSync.reload //Перезагрузка
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
/* const px2rem = require('gulp-smile-px2rem'); // Переводим в rem */
const gcmq = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css'); // Сжимаем файлы Минификация
const sourcemaps = require('gulp-sourcemaps');//Рисует карты css
const svgo = require('gulp-svgo');
const svgSprite = require('gulp-svg-sprite');

// Указываем компилятор имеено на nodejs
sass.compiler = require('node-sass'); 

//очищаем папку dist после каждого изменения для последующего сохранения 
task('clean', () => {
    return src("dist/**/*", { read: false}).pipe(rm());
});

//Копируем готовые файлы
 task("copy:html", () => {
    return src('src/*.html')
    .pipe(dest("dist"))
    .pipe(reload({stream: true}));
 });

//Подключаем сss зависемые файлы и склеиваем 
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
    .pipe(px2rem()) // переводим в em для адаптива
    .pipe(autoprefixer(
        {overrideBrowserslist:
             ['last 4 versions'] })) 
    /*.pipe(gcmq())*/  //!с soursmaps! Обьединяем одинаковые по параметрам медиа запросы
    .pipe(cleanCSS()) // Сжимаем файлы Минификация
    .pipe(sourcemaps.write('.')) // 
    .pipe(dest("dist")); // Положили в папку
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
            sprite: "./dist/images/icons/sprite.svg"
           }
       }
    }))
    .pipe(dest("dist/images/icons")); 
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
 watch('src/*.html', series("copy:html")); 
 watch('./src/images/icons/*.svg', series("icons")); 

 // Запуск по умолчанию соблюдаем последовательность дополняемых задач
 task("default", series("clean", "copy:html", "styles", "icons", "server"));
    
