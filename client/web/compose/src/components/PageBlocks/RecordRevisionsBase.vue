<template>
  <wrap
    v-bind="$props"
    :scrollable-body="true"
    v-on="$listeners"
    @refreshBlock="refresh"
  >
    <div
      class="d-flex flex-column align-items-center h-100 overflow-hidden"
    >
      <span
        v-if="revisionsDisabledOnModule"
        class="my-auto"
      >
        {{ $t('errors.disabled-on-module') }}
      </span>

      <b-spinner
        v-else-if="isProcessing"
        class="my-auto"
      />

      <b-button
        v-else-if="!preloadRevisions && !loadedRevisions"
        class="my-auto"
        @click="refresh()"
      >
        {{ $t('show-revisions', { revision: record.revision }) }}
      </b-button>

      <template
        v-else
      >
        <b-table-lite
          :items="revisions"
          :fields="columns"
          sticky-header
          hover
          class="flex-fill mh-100 mb-0 w-100 rounded"
        >
          <template #cell(timestamp)="row">
            {{ row.item.timestamp | locFullDateTime }}
          </template>
          <template
            #cell(adt)="row"
          >
            <b-button
              v-if="row.item.changes && row.item.changes.length > 0"
              variant="link"
              class="py-0 m-0"
              @click="row.toggleDetails"
            >
              {{ row.detailsShowing ? '&times;' : $t(`show-changes`, { count: row.item.changes.length }) }}
            </b-button>
          </template>

          <template #row-details="row">
            <div
              class="pl-5"
            >
              <b-table-simple small>
                <b-thead>
                  <b-tr class="text-primary">
                    <b-th>{{ $t('changes.columns.field.label') }}</b-th>
                    <b-th>{{ $t('changes.columns.old-value.label') }}</b-th>
                    <b-th>{{ $t('changes.columns.new-value.label') }}</b-th>
                  </b-tr>
                </b-thead>
                <b-tbody
                  v-for="(change) in row.item.changes"
                  :key="change.key"
                >
                  <b-tr>
                    <b-td :rowspan="Math.max(change.new ? change.new.length : 0, change.old ? change.old.length : 0)">
                      {{ change.key }}
                    </b-td>
                    <b-td>{{ change.old ? change.old[0] : '-' }}</b-td>
                    <b-td>{{ change.new ? change.new[0] : '-' }}</b-td>
                  </b-tr>
                  <b-tr
                    v-for="index in Math.max(change.new ? change.new.length - 1 : 0, change.old ? change.old.length - 1 : 0)"
                    :key="change.key + index"
                  >
                    <b-td>{{ change.old && change.old.length > index ? change.old[index]: '-' }}</b-td>
                    <b-td>{{ change.new && change.new.length > index ? change.new[index]: '-' }}</b-td>
                  </b-tr>
                </b-tbody>
              </b-table-simple>
            </div>
          </template>
        </b-table-lite>

        <div
          v-if="!revisions.length"
          class="position-absolute text-center mt-5 d-print-none"
          style="left: 0; right: 0; bottom: calc(50% - 33px);"
        >
          <p class="mb-0 mx-2">
            {{ $t('errors.no-revisions') }}
          </p>
        </div>
      </template>
    </div>
  </wrap>
</template>
<script>
import base from './base'
import { NoID } from '@cortezaproject/corteza-js'

export default {
  i18nOptions: {
    namespaces: 'block',
    keyPrefix: 'recordRevisions.viewer',
  },

  components: {},

  extends: base,

  data () {
    return {
      /**
       * Last error that occurred
       * while loading the revisions
       */
      error: null,

      /**
       * When true, the revisions are being loaded
       * controled from refresh() method
       */
      processing: false,

      /**
       * Flag for if user clicked on show revisions button
       */
      loadedRevisions: false,

      /**
       * List of revisions when loaded
       */
      revisions: [],

      /**
       * Revisions table fields
       *
       * Please note that table utilizes row-details feature
       * where changes are displayed
       */
      columns: [
        {
          key: 'revision',
          label: '#',
          thClass: 'border-top-0',
          class: 'text-center',
        },
        {
          key: 'timestamp',
          label: this.$t('revisions.columns.timestamp.label'),
          thClass: 'border-top-0',
        },
        {
          key: 'operation',
          label: this.$t('revisions.columns.operation.label'),
          thClass: 'border-top-0',
        },
        {
          key: 'user',
          label: this.$t('revisions.columns.user.label'),
          thClass: 'border-top-0',
          formatter: (u) => u ? (u.name || u.email || u.userID) : '-',
        },
        {
          key: 'adt',
          label: '',
          thClass: 'border-top-0',
          class: 'text-nowrap text-right',
        },
      ],
    }
  },

  computed: {
    showHeader () {
      return !!this.block.title || !!this.block.description
    },

    revisionsDisabledOnModule () {
      return this.module ? !this.module.config.recordRevisions.enabled : false
    },

    preloadRevisions () {
      return this.options.preload
    },
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

  beforeDestroy () {
    this.setDefaultValues()
    this.destroyEvents()
  },

  created () {
    this.refreshBlock(this.refresh)
  },

  mounted () {
    this.createEvents()
  },

  methods: {
    createEvents () {
      this.$root.$on('module-records-updated', this.refreshOnRelatedRecordsUpdate)

      if (!this.isRecordPage) {
        this.$root.$on('refetch-records', this.refresh)
      }
    },

    refreshOnRelatedRecordsUpdate ({ moduleID }) {
      if (this.module.moduleID === moduleID) {
        this.refresh()
      }
    },

    async loadRevisions () {
      if (this.revisionsDisabledOnModule) {
        return
      }

      if (!this.record || this.record.recordID === NoID) {
        return
      }

      const { $ComposeAPI, $SystemAPI } = this

      this.processing = true

      return this.block.fetch($ComposeAPI, this.record)
        .then(set => {
          this.revisions = set
        })
        .then(() => this.block.expandReferences({ $ComposeAPI, $SystemAPI }, this.module, this.revisions))
        .finally(() => {
          setTimeout(() => {
            this.processing = false
          }, 300)
        })
    },

    refresh () {
      this.loadedRevisions = true
      this.loadRevisions()
    },

    setDefaultValues () {
      this.error = null
      this.processing = false
      this.loadedRevisions = false
      this.revisions = []
      this.columns = []
    },

    destroyEvents () {
      this.$root.$off('module-records-updated', this.refreshOnRelatedRecordsUpdate)

      if (!this.isRecordPage) {
        this.$root.$off('refetch-records', this.refresh)
      }
    },
  },
}
</script>
