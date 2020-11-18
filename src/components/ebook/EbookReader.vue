<template>
  <div class="ebook-reader">
    <!-- {{$route.params.fileName}} -->
    <div id="read"></div>

    <!-- <div class="ebook-reader-mask">

    </div> -->
    </div>
</template>

<script>
  import { ebookMixin } from '../../utils/mixin'
  import Epub from 'epubjs'
import { getFontFamily, saveFontFamily, saveFontSize, getFontSize } from '../../utils/localStorage'

  global.ePub = Epub
  export default {
    mixins: [ebookMixin],
    methods: {
      initEpub() {
        const url = 'http://192.168.0.196:8081/epub/' + this.fileName + '.epub'
        console.log('url:::', url)
        this.book = new Epub(url)
        console.log('Book: ', this.book)
        this.setCurrentBook(this.book)
        this.initRendition()
        // this.setBookAvailable(true)
      },
      initFontSize() {
        let fontSize = getFontSize(this.fileName)
        if (!fontSize) {
          saveFontSize(this.fileName, this.defaultFontSize)
        } else {
          this.rendition.themes.fontSize(fontSize)
          this.setDefaultFontSize(fontSize)
        }
      },
      initFontFamily() {
        let font = getFontFamily(this.fileName)
        if (!font) {
          saveFontFamily(this.fileName, this.defaultFontFamily)
        } else {
          this.rendition.themes.font(font)
          this.setDefaultFontFamily(font)
        }
      },
      initRendition() {
        this.rendition = this.book.renderTo('read', {
          width: innerWidth,
          height: innerHeight,
          method: 'default'
        })
        this.rendition.display().then(() => {
          this.initFontSize()
          this.initFontFamily()
        })
        this.rendition.on('touchstart', event => {
          console.log(event)
          this.touchStartX = event.changedTouches[0].clientX
          this.touchStartTime = event.timeStamp
        })
        this.rendition.on('touchend', event => {
          console.log(event)
          const offsetX = event.changedTouches[0].clientX - this.touchStartX
          const time = event.timeStamp - this.touchStartTime
            console.log(offsetX, time)
          if (time < 500 && offsetX > 40) {
            this.nextPage()
          } else if (time < 500 && offsetX < -40) {
            this.prevPage()
          } else {
            this.toggleTitleAndMenu()
          }
          event.preventDefault()
          event.stopPropagation()
        })
        this.rendition.hooks.content.register(contents => {
          Promise.all([
            contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/daysOne.css`),
            contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/cabin.css`),
            contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/montserrat.css`),
            contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/tangerine.css`)
          ]).then(() => {})
        })
        // const location = getLocation(this.fileName)
        // this.display(location, () => {
        //   this.initGlobalStyle()
        // })
      },
      prevPage() {
        if (this.rendition) {
          this.rendition.prev()
          this.hideTitleAndMenu()
        }
      },
      nextPage() {
        if (this.rendition) {
          this.rendition.next()
          this.hideTitleAndMenu()
        }
      },
      toggleTitleAndMenu() {
        // this.$store.dispatch('setMenuVisible', !this.menuVisible)
        if (this.menuVisible) {
          this.setSettingVisible(-1)
          this.setFontFamilyVisible(false)
        }
        this.setMenuVisible(!this.menuVisible)
      },
      hideTitleAndMenu() {
        // this.$store.dispatch('setMenuVisible', false)
        this.setMenuVisible(false)
        this.setSettingVisible(-1)
        this.setFontFamilyVisible(false)
      }
    },
    mounted() {
        // const baseUrl = 'http://192.168.0.196:8081/epub/'
        console.log('filename:::', this.$route.params.fileName)
        const fileName = this.$route.params.fileName.split('|').join('/')
        console.log(fileName)
        this.setFileName(fileName).then(() => {
          this.initEpub()
        })
        // const books = this.$route.params.fileName.split('|')
        // // const fileName = books[1]
        // this.setFileName(books.join('/')).then(() => {
        //   const url = process.env.VUE_APP_EPUB_URL + '/' + this.fileName + '.epub'
        //   this.initEpub(url)
        // })
      }
  }
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
  @import "../../assets/styles/global";

  .ebook-reader {
    width: 100%;
    height: 100%;
    // overflow: hidden;
    // .ebook-reader-mask {
    //   position: absolute;
    //   top: 0;
    //   left: 0;
    //   background: transparent;
    //   z-index: 150;
    //   width: 100%;
    //   height: 100%
    // }
    // #read {
    //   width: 100%;
    //   height: 100%;
    //   .epub-container {
    //     width: 100%;
    //     .epub-view {
    //       width: 100% !important;
    //       iframe {
    //         width: 375px !important;
    //       }
    //     }
    //   }
    // }
  }
</style>
