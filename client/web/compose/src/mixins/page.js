import { compose } from '@cortezaproject/corteza-js'
import { mapGetters } from 'vuex'

export default {
  props: {
    namespace: {
      // via router-view
      type: compose.Namespace,
      required: true,
    },
    page: {
      // via route-view
      type: compose.Page,
      required: true,
    },
    // We're using recordID to check if we need to display router-view or grid component
    recordID: {
      type: String,
      default: '',
    },
  },

  data () {
    return {
      layouts: [],
      layout: undefined,
      blocks: undefined,

      tempRecord: undefined,
    }
  },

  computed: {
    ...mapGetters({
      getPageLayouts: 'pageLayout/getByPageID',
    }),

    isRecordPage () {
      return this.recordID || this.$route.name === 'page.record.create'
    },
  },

  methods: {
    expressionVariables () {
      const record = this.tempRecord || this.record

      return {
        user: this.$auth.user,
        record: record ? record.serialize() : {},
        screen: {
          width: window.innerWidth,
          height: window.innerHeight,
          userAgent: navigator.userAgent,
          breakpoint: this.getBreakpoint(), // This is from a global mixin uiHelpers
        },
        oldLayout: this.layout,
        layout: undefined,
        ...(this.isRecordPage && {
          isView: !this.edit && !this.isNew,
          isCreate: this.isNew,
          isEdit: this.edit && !this.isNew,
        }),
      }
    },

    async evaluateLayoutExpressions () {
      const expressions = {}
      const variables = this.expressionVariables()

      this.layouts.forEach(layout => {
        const { config = {} } = layout
        if (!config.visibility.expression) return

        variables.layout = layout

        expressions[layout.pageLayoutID] = config.visibility.expression
      })

      return this.$SystemAPI.expressionEvaluate({ variables, expressions }).catch(e => {
        this.toastErrorHandler(this.$t('notification:evaluate.failed'))(e)
        Object.keys(expressions).forEach(key => (expressions[key] = false))

        return expressions
      })
    },

    async determineLayout ({ pageLayoutID, redirectOnFail = true } = {}) {
      // Clear stored records so they can be refetched with latest values
      this.clearRecordSet()

      if (this.isRecordPage) {
        this.resetErrors()
      }

      let expressions = {}

      // Only evaluate if one of the layouts has an expressions variable
      if (this.layouts.some(({ config = {} }) => config.visibility.expression)) {
        expressions = await this.evaluateLayoutExpressions()
      }

      // Check layouts for expressions/roles and find the first one that fits
      const matchedLayout = this.layouts.find(l => {
        if (pageLayoutID && l.pageLayoutID !== pageLayoutID) return false

        const { expression, roles = [] } = l.config.visibility

        if (expression && !expressions[l.pageLayoutID]) return false

        if (!roles.length) return true

        return this.$auth.user.roles.some(roleID => roles.includes(roleID))
      })

      if (!matchedLayout) {
        this.toastWarning(this.$t('notification:page.page-layout.notFound.view'))

        if (redirectOnFail) {
          this.$router.go(-1)
        }

        return
      }

      if (this.isRecordPage) {
        this.inEditing = this.edit
      }

      if (this.layout && matchedLayout.pageLayoutID === this.layout.pageLayoutID) {
        this.evaluateBlocks()
        return
      }

      this.layout = matchedLayout

      if (this.isRecordPage) {
        this.handleRecordButtons()
      } else {
        const { handle, meta = {} } = this.layout || {}
        const title = meta.title || this.page.title
        this.pageTitle = title || handle || this.$t('navigation:noPageTitle')
        document.title = [title, this.namespace.name, this.$t('general:label.app-name.public')].filter(v => v).join(' | ')
      }

      return this.prepareBlocks()
    },

    async prepareBlocks () {
      const tempBlocks = []
      const { blocks = [] } = this.layout || {}

      blocks.forEach(({ blockID, xywh }) => {
        const block = this.page.blocks.find(b => b.blockID === blockID)

        block.xywh = xywh
        tempBlocks.push(block)
      })

      if (this.isRecordPage) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      this.blocks = undefined

      return this.evaluateBlocks(tempBlocks, this.isRecordPage)
    },

    async evaluateBlocks (blocks = this.page.blocks, async = false) {
      const layoutBlocks = this.layout.blocks
      let layoutBlocksExpressions = {}

      // Only evaluate expressions if any blocks have visibility expressions
      if (layoutBlocks.some(({ meta = {} }) => (meta.visibility || {}).expression)) {
        if (async) {
          await new Promise(resolve => setTimeout(resolve, 300))
        }

        layoutBlocksExpressions = await this.evaluateBlocksExpressions()
      }

      blocks.forEach(block => {
        const { blockID, meta = {} } = block
        const visibility = meta.visibility || {}
        const { roles = [] } = visibility

        // Determine if block should be shown based on expression and roles
        const validExpression = !visibility.expression || layoutBlocksExpressions[blockID]
        const validRole = !roles.length || this.$auth.user.roles.some(roleID => roles.includes(roleID))
        const showBlock = block && validExpression && validRole

        // Update invisible status based on visibility evaluation
        block.meta.invisible = !showBlock
      })

      return blocks
    },

    async evaluateBlocksExpressions () {
      const expressions = {}
      const variables = this.expressionVariables()

      this.layout.blocks.forEach(block => {
        const { visibility } = block.meta
        if (!(visibility || {}).expression) return

        expressions[block.blockID] = visibility.expression
      })

      return this.$SystemAPI.expressionEvaluate({ variables, expressions }).catch(e => {
        this.toastErrorHandler(this.$t('notification:evaluate.failed'))(e)
        Object.keys(expressions).forEach(key => (expressions[`${key}`] = false))

        return expressions
      })
    },
  },
}
