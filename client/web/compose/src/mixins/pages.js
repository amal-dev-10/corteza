import { NoID } from '@cortezaproject/corteza-js'
import { fetchID } from 'corteza-webapp-compose/src/lib/block'

export default {
  data () {
    return {
      processingClone: false,
    }
  },

  methods: {
    handleClone () {
      this.processing = true
      this.processingClone = true

      const { namespaceID = NoID } = this.namespace

      let page = this.page.clone()

      // Change tabbed blockID to use tempID's since they are persisted on save
      const blocks = page.blocks.map(block => {
        if (block.kind !== 'Tabs') return block
        const { tabs = [] } = block.options

        block.options.tabs = tabs.map(b => {
          const { tempID } = (page.blocks.find(({ blockID }) => blockID === b.blockID) || {}).meta || {}
          b.blockID = tempID
          return b
        })

        return block
      })

      page = {
        ...page,
        blocks,
        pageID: NoID,
        title: this.$t('copyOf', { title: this.page.title }),
        handle: '',
      }

      this.loading = true

      return this.createPage({ namespaceID, ...page }).then((page) => {
        return this.cloneLayouts(page.pageID).then(() => {
          return this.updateTabbedBlockIDs(page)
        })
      }).then(page => {
        this.page = page.clone()
        this.initialPageState = this.page.clone()

        this.toastSuccess(this.$t('notification:page.saved'))
        this.$router.push({ name: this.$route.name, params: { pageID: this.page.pageID } })
      }).catch(e => {
        this.toastErrorHandler(this.$t('notification:page.cloneFailed'))(e)
        this.loading = false
      }).finally(() => {
        this.processing = false
        this.processingClone = false
      })
    },

    cloneLayouts (pageID) {
      const layouts = [...this.layouts]
      return Promise.all(layouts.map(layout => {
        layout.pageID = pageID
        layout.pageLayoutID = NoID
        return this.createPageLayout(layout)
      }))
    },

    async updateTabbedBlockIDs (page) {
      // get the Tabs Block that still has tabs with tempIDs
      let updatePage = false

      page.blocks.filter(({ kind }) => kind === 'Tabs')
        .filter(({ options = {} }) => options.tabs.some(({ blockID }) => (blockID || '').startsWith('tempID-')))
        .forEach(b => {
          if (b.kind !== 'Tabs') return

          b.options.tabs.forEach((t, j) => {
            if (!t.blockID.startsWith('tempID-')) return false

            // find a block with the same tempID that should be updated by now and get its blockID
            const updatedBlock = page.blocks.find(block => block.meta.tempID === t.blockID)

            if (!updatedBlock) return false

            const tab = {
              // fetchID gets the blockID using the found block
              blockID: fetchID(updatedBlock),
              title: t.title,
            }

            b.options.tabs.splice(j, 1, tab)
            updatePage = true
          })
        })

      if (!updatePage) {
        return page
      }

      return this.updatePage(page)
    },
  },
}
