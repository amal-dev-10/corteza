<template>
  <div
    class="h-100 p-2"
  >
    <portal to="topbar-title">
      {{ title }}
    </portal>

    <portal to="topbar-tools">
      <b-button-group
        v-if="modulePage"
        size="sm"
      >
        <b-button
          variant="primary"
          :disabled="!modulePage"
          :to="modulePage"
          style="margin-right:2px;"
          class="d-flex align-items-center"
        >
          {{ $t('edit.edit') }}
          <font-awesome-icon
            :icon="['far', 'edit']"
            size="sm"
            class="ml-2"
          />
        </b-button>
      </b-button-group>
    </portal>

    <record-list-base
      v-if="block && page && module"
      :block="block"
      :page="page"
      :module="module"
      :namespace="namespace"
      :block-index="0"
      class="p-2"
      @save-fields="handleFieldsSave"
    />
  </div>
</template>

<script>

import { mapGetters, mapActions } from 'vuex'
import { compose, NoID } from '@cortezaproject/corteza-js'
import RecordListBase from 'corteza-webapp-compose/src/components/PageBlocks/RecordListBase'

export default {
  i18nOptions: {
    namespaces: 'module',
  },

  components: {
    RecordListBase,
  },

  props: {
    namespace: {
      type: Object,
      required: false,
      default: undefined,
    },

    moduleID: {
      type: String,
      required: false,
      default: '',
    },
  },

  data () {
    return {
      block: undefined,
    }
  },

  computed: {
    ...mapGetters({
      getModuleByID: 'module/getByID',
      recordPaginationUsable: 'ui/recordPaginationUsable',
    }),

    title () {
      const { name, handle } = this.module
      return this.$t('allRecords.list.title', { name: name || handle, interpolation: { escapeValue: false } })
    },

    module () {
      if (this.moduleID) {
        return this.getModuleByID(this.moduleID)
      } else {
        return undefined
      }
    },

    modulePage () {
      if (this.module) {
        return { name: 'admin.modules.edit', params: { moduleID: this.module.moduleID }, query: null }
      }

      return undefined
    },

    page () {
      if (!this.module) {
        return undefined
      }

      // Fake the pageID so record list uniqueID can be properly made
      const { moduleID } = this.module
      return new compose.Page({ pageID: moduleID })
    },
  },

  watch: {
    moduleID: {
      handler () {
        if (this.module) {
          const { meta = { ui: {} }, moduleID } = this.module || {}

          let fields = ((meta.ui || {}).admin || {}).fields || []
          fields = fields.length ? fields : [...this.module.fields.slice(0, 10), ...this.module.systemFields()]

          this.block.options.moduleID = moduleID
          this.block.options.fields = fields
        }
      },
    },
  },

  created () {
    const { meta = { ui: {} }, moduleID } = this.module || {}

    let fields = ((meta.ui || {}).admin || {}).fields || []
    fields = fields.length ? fields : [...this.module.fields.slice(0, 10), ...this.module.systemFields()]

    // Init block
    const block = new compose.PageBlockRecordList({
      blockIndex: 0,
      options: {
        moduleID,
        fields,
        hideRecordReminderButton: true,
        hideRecordViewButton: true,
        hideRecordCloneButton: false,
        hideRecordPermissionsButton: false,
        selectable: true,
        allowExport: true,
        perPage: 14,
        fullPageNavigation: true,
        showTotalCount: true,
        showDeletedRecordsOption: true,
        presort: 'createdAt DESC',
        enableRecordPageNavigation: true,
        hideConfigureFieldsButton: false,
        inlineRecordEditEnabled: true,
        customFilterPresets: true,
      },
    })

    block.options = {
      ...block.options,
      allRecords: true,
      rowViewUrl: 'admin.modules.record.view',
      rowEditUrl: 'admin.modules.record.edit',
      rowCreateUrl: 'admin.modules.record.create',
    }

    this.block = block

    // If the page changed we need to clear the record pagination since its not relevant anymore
    if (this.recordPaginationUsable) {
      this.setRecordPaginationUsable(false)
    } else {
      this.clearRecordIDs()
    }
  },

  beforeDestroy () {
    this.setDefaultValues()
  },

  methods: {
    ...mapActions({
      updateModule: 'module/update',
      setRecordPaginationUsable: 'ui/setRecordPaginationUsable',
      clearRecordIDs: 'ui/clearRecordIDs',
    }),

    handleFieldsSave (fields = []) {
      fields = fields.map((f) => f.fieldID && f.fieldID !== NoID ? f.fieldID : f.name).filter(f => !!f)

      if (!this.module.meta.ui) {
        this.module.meta.ui = { admin: { fields } }
      } else {
        this.module.meta.ui.admin = { ...(this.module.meta.ui.admin || {}), fields }
      }

      this.updateModule(this.module)
    },

    setDefaultValues () {
      this.block = undefined
    },
  },
}
</script>
