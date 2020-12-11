<template>
  <div class="ebook-reader">
    <!-- {{$route.params.fileName}} -->
    <div id="read"></div>
    <div class="ebook-reader-mask"
         @click="onMaskClick"
         @touchmove="move"
         @touchend="moveEnd"
         @mousedown.left="onMouseEnter"
         @mousemove.left="onMouseMove"
         @mouseup.left="onMouseEnd">
    </div>
  </div>
</template>

<script>
  import { ebookMixin } from '../../utils/mixin'
  import Epub from 'epubjs'
  import {
    getFontFamily,
    saveFontFamily,
    saveFontSize,
    getFontSize,
    getTheme,
    saveTheme,
    getLocation
  } from '../../utils/localStorage'
  import { flatten } from '../../utils/book'

  global.ePub = Epub
  export default {
    mixins: [ebookMixin],
    methods: {
      initEpub() {
        const url = process.env.VUE_APP_RES_URL + '/epub/' + this.fileName + '.epub'
        console.log('url:::', url)
        this.book = new Epub(url)
        console.log('Book: ', this.book)
        this.setCurrentBook(this.book)
        this.initRendition()
        this.initGesture()
        this.parseBook()
        this.book.ready.then(() => {
          return this.book.locations.generate(750 * (window.innerWidth / 375) * (getFontSize(this.fileName) / 16))
        }).then(locations => {
          console.log('locations', locations)
          this.navigation.forEach(nav => {
            nav.pagelist = []
          })
          locations.forEach(item => {
            const loc = item.match(/\[(.*)\]!/)[1]
            this.navigation.forEach(nav => {
              if (nav.href) {
                const href = nav.href.match(/^(.*)\.html$/)
                if (href) {
                  if (href[1] === loc) {
                    nav.pagelist.push(item)
                  }
                }
              }
            })
            let currentPage = 1
            this.navigation.forEach((nav, index) => {
              if (index === 0) {
                nav.page = 1
              } else {
                nav.page = currentPage
              }
              currentPage += nav.pagelist.length + 1
            })
          })
          this.setPagelist(locations)
          this.setBookAvailable(true)
          this.refreshLocation()
        })
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
      initGesture() {
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
      },
      initTheme() {
        let defaultTheme = getTheme(this.fileName)
        if (!defaultTheme) {
          defaultTheme = this.themeList[0].name
          saveTheme(this.fileName, defaultTheme)
        }
        this.setDefaultTheme(defaultTheme)
        this.themeList.forEach(theme => {
          this.rendition.themes.register(theme.name, theme.style)
        })
        this.rendition.themes.select(defaultTheme)
      },
      initRendition() {
        this.rendition = this.book.renderTo('read', {
          width: innerWidth,
          height: innerHeight,
          method: 'default'
        })
        // this.rendition.display().then(() => {
        //   this.initTheme()
        //   this.initFontSize()
        //   this.initFontFamily()
        //   this.initGlobalStyle()
        //   this.refreshLocation()
        // })
        const location = getLocation(this.fileName)
        this.display(location, () => {
          this.initTheme()
          this.initFontSize()
          this.initFontFamily()
          this.initGlobalStyle()
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
          this.rendition.prev().then(() => {
            this.refreshLocation()
          })
          this.hideTitleAndMenu()
        }
      },
      nextPage() {
        if (this.rendition) {
          this.rendition.next().then(() => {
            this.refreshLocation()
          })
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
      move(e) {
        let offsetY = 0
        if (this.firstOffsetY) {
          offsetY = e.changedTouches[0].clientY - this.firstOffsetY
          this.setOffsetY(offsetY)
        } else {
          this.firstOffsetY = e.changedTouches[0].clientY
        }
        e.preventDefault()
        e.stopPropagation()
      },
      moveEnd(e) {
        this.setOffsetY(0)
        this.firstOffsetY = null
      },
      onMouseEnd(e) {
        if (this.mouseState === 2) {
          this.setOffsetY(0)
          this.firstOffsetY = null
          this.mouseState = 3
        } else {
          this.mouseState = 4
        }
        const time = e.timeStamp - this.mouseStartTime
        if (time < 100) {
          this.mouseState = 4
        }
        e.preventDefault()
        e.stopPropagation()
      },
      onMouseMove(e) {
        if (this.mouseState === 1) {
          this.mouseState = 2
        } else if (this.mouseState === 2) {
          let offsetY = 0
          if (this.firstOffsetY) {
            offsetY = e.clientY - this.firstOffsetY
            this.setOffsetY(offsetY)
          } else {
            this.firstOffsetY = e.clientY
          }
        }
        e.preventDefault()
        e.stopPropagation()
      },
      onMouseEnter(e) {
        this.mouseState = 1
        this.mouseStartTime = e.timeStamp
        e.preventDefault()
        e.stopPropagation()
      },
      onMaskClick(e) {
        if (this.mouseState && (this.mouseState === 2 || this.mouseState === 3)) {
          return
        }
        const offsetX = e.offsetX
        const width = window.innerWidth
        if (offsetX > 0 && offsetX < width * 0.3) {
          this.prevPage()
        } else if (offsetX > 0 && offsetX > width * 0.7) {
          this.nextPage()
        } else {
          this.toggleTitleAndMenu()
        }
      },
      parseBook() {
        this.book.loaded.cover.then(cover => {
          console.log('cover::', cover)
          this.book.archive.createUrl(cover).then(url => {
            console.log('cover url::', url)
            this.setCover(url)
          })
          this.book.loaded.metadata.then(metadata => {
            this.setMetadata(metadata)
          })
          this.book.loaded.navigation.then(nav => {
            console.log('catalog tree:::', nav.toc)
            const navItem = flatten(nav.toc)
            console.log('become one level catalog tree:::', navItem)
            function find(item, level = 0) {
              return !item.parent ? level : find(navItem.filter(parentItem => parentItem.id === item.parent)[0], ++level)
            }

            navItem.forEach(item => {
              item.level = find(item)
            })
            console.log('finished one level catalog::', navItem)
            this.setNavigation(navItem)
          })
        })
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
    overflow: hidden;
    .ebook-reader-mask {
      position: absolute;
      top: 0;
      left: 0;
      background: transparent;
      z-index: 150;
      width: 100%;
      height: 100%;
    }
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
