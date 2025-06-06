<template>
  <wrap
    v-bind="$props"
    v-on="$listeners"
    @refreshBlock="refresh"
  >
    <div
      v-if="isProcessing"
      class="d-flex align-items-center justify-content-center h-100"
    >
      <b-spinner />
    </div>

    <div
      v-else
      class="d-flex h-100"
      :class="{ 'p-2': block.style.wrap.kind === 'card' }"
    >
      <c-progress
        :value="value"
        :min="min"
        :max="max"
        :labeled="options.display.showValue"
        :relative="options.display.showRelative"
        :progress="options.display.showProgress"
        :striped="options.display.striped"
        :animated="options.display.animated"
        :variant="options.display.variant"
        :thresholds="options.display.thresholds"
        class="flex-fill h-100"
      />
    </div>
  </wrap>
</template>

<script>
import base from './base'
import { NoID } from '@cortezaproject/corteza-js'
import { components } from '@cortezaproject/corteza-vue'
import { evaluatePrefilter, isFieldInFilter } from 'corteza-webapp-compose/src/lib/record-filter'
const { CProgress } = components

export default {
  components: {
    CProgress,
  },

  extends: base,

  data () {
    return {
      processing: false,
      value: undefined,
      min: undefined,
      max: undefined,
    }
  },

  watch: {
    'record.recordID': {
      immediate: true,
      handler () {
        this.refresh()
      },
    },

    options: {
      deep: true,
      handler () {
        this.refresh()
      },
    },
  },

  created () {
    this.refreshBlock(this.refresh)
  },

  mounted () {
    this.createEvents()
  },

  beforeDestroy () {
    this.destroyEvents()
    this.setDefaultValues()
  },

  methods: {
    createEvents () {
      this.$root.$on('module-records-updated', this.refreshOnRelatedRecordsUpdate)
      this.$root.$on('record-field-change', this.refetchOnPrefilterValueChange)

      if (!this.isRecordPage) {
        this.$root.$on('refetch-records', this.refresh)
      }
    },

    refetchOnPrefilterValueChange ({ fieldName }) {
      const { value } = this.options

      if (isFieldInFilter(fieldName, value.filter)) {
        this.refresh()
      }
    },

    /**
     * Pulls fresh data from the API
     */
    async refresh () {
      this.processing = true

      const { namespaceID } = this.namespace || {}

      const additionalOptions = {
        value: {
          filter: evaluatePrefilter(this.options.value.filter, {
            record: this.record,
            user: this.$auth.user || {},
            recordID: (this.record || {}).recordID || NoID,
            ownerID: (this.record || {}).ownedBy || NoID,
            userID: (this.$auth.user || {}).userID || NoID,
          }),
        },
        minValue: {
          filter: evaluatePrefilter(this.options.minValue.filter, {
            record: this.record,
            user: this.$auth.user || {},
            recordID: (this.record || {}).recordID || NoID,
            ownerID: (this.record || {}).ownedBy || NoID,
            userID: (this.$auth.user || {}).userID || NoID,
          }),
        },
        maxValue: {
          filter: evaluatePrefilter(this.options.maxValue.filter, {
            record: this.record,
            user: this.$auth.user || {},
            recordID: (this.record || {}).recordID || NoID,
            ownerID: (this.record || {}).ownedBy || NoID,
            userID: (this.$auth.user || {}).userID || NoID,
          }),
        },
      }

      return this.block.fetch(additionalOptions, this.$ComposeAPI, namespaceID)
        .then(({ value, min = 0, max = 100 }) => {
          this.min = min
          this.max = max
          this.value = value
        }).catch(this.toastErrorHandler(this.$t('progress.fetch-failed')))
        .finally(() => {
          setTimeout(() => {
            this.processing = false
          }, 300)
        })
    },

    refreshOnRelatedRecordsUpdate ({ moduleID, notPageID }) {
      if (this.options.value.moduleID === moduleID && this.page.pageID !== notPageID) {
        this.refresh()
      }
    },

    setDefaultValues () {
      this.value = undefined
      this.min = undefined
      this.max = undefined
    },

    destroyEvents () {
      this.$root.$off('module-records-updated', this.refreshOnRelatedRecordsUpdate)
      this.$root.$off('record-field-change', this.refetchOnPrefilterValueChange)

      if (!this.isRecordPage) {
        this.$root.$off('refetch-records', this.refresh)
      }
    },
  },
}
</script>
