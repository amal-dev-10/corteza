<template>
  <b-card
    data-test-id="card-requests"
    no-body
    footer-class="border-top border-top border-top d-flex align-items-center justify-content-center"
    header-class="border-bottom"
    class="shadow-sm"
  >
    <template #header>
      <h4 class="mb-0">
        {{ $t('general:label.requests') }}
      </h4>
    </template>

    <div class="d-flex align-items-center flex-wrap flex-fill p-3 gap-1">
      <div class="flex-fill">
        <b-button
          data-test-id="button-refresh"
          variant="primary"
          :disabled="loading"
          @click="loadItems()"
        >
          {{ $t('general:label.refresh') }}
        </b-button>
        <span
          class="ml-1"
          :class="{ 'loading': loading }"
        >
          {{ autoRefreshLabel }}
        </span>
      </div>

      <c-input-confirm
        :disabled="!items.length"
        :processing="processingPurge"
        :text="$t('purge.this')"
        variant="danger"
        @confirmed="purgeRequests"
      />
    </div>

    <b-card-body
      class="p-0"
    >
      <b-table
        id="hit-list"
        hover
        responsive
        head-variant="light"
        class="mb-0"
        primary-key="hitID"
        :sort-by.sync="sorting.sortBy"
        :sort-desc.sync="sorting.sortDesc"
        :items="items"
        :fields="fields"
        :busy="loading"
        no-local-sorting
        @sort-changed="resetItems"
      >
        <template #cell(http_method)="row">
          {{ row.item.request.Method }}
        </template>
        <template #cell(http_status_code)="row">
          <h6 class="mb-0">
            <b-badge :variant="getStatusCodeVariant(row.item.http_status_code)">
              {{ row.item.http_status_code }}
            </b-badge>
          </h6>
        </template>
        <template #cell(content_length)="row">
          {{ `${((row.item.request.ContentLength || 0) / 1000).toFixed(3)} kB` }}
        </template>
        <template #cell(actions)="row">
          <b-button
            data-test-id="button-edit-route"
            variant="link"
            class="p-0"
            :to="{ name: 'system.apigw.profiler.hit', params: { hitID: row.item.hitID } }"
          >
            <font-awesome-icon
              :icon="['fas', 'info-circle']"
              class="text-primary"
            />
          </b-button>
        </template>
      </b-table>
    </b-card-body>

    <template #footer>
      <b-button
        v-if="items.length"
        variant="light"
        :disabled="!hasNextPage || loading"
        @click="loadMore()"
      >
        {{ $t('general:label.loadMore') }}
      </b-button>
    </template>
  </b-card>
</template>

<script>
import { fmt } from '@cortezaproject/corteza-js'
import listHelpers from 'corteza-webapp-admin/src/mixins/listHelpers'

export default {
  mixins: [
    listHelpers,
  ],

  i18nOptions: {
    namespaces: ['system.apigw'],
    keyPrefix: 'profiler',
  },

  props: {
    // Must be base64
    route: {
      type: String,
      default: '',
    },
  },

  data () {
    return {
      processingPurge: false,

      filter: {
        routeID: '',
        next: '',
        before: '',
        query: '',
      },

      sorting: {
        sortBy: 'time_start',
        sortDesc: true,
      },

      totalItems: 0,

      items: [],

      refresh: {
        timer: undefined,
        countdown: 0,
      },

      fields: [
        {
          key: 'time_start',
          sortable: true,
          formatter: v => v ? fmt.fullDateTime(v) : '',
        },
        {
          key: 'time_finish',
          sortable: true,
          formatter: v => v ? fmt.fullDateTime(v) : '',
        },
        {
          key: 'http_method',
          sortable: true,
          class: 'text-center',
        },
        {
          key: 'http_status_code',
          sortable: true,
          class: 'text-center',
        },
        {
          key: 'content_length',
          sortable: true,
          formatter: v => `${v || 0} bytes`,
          class: 'text-right',
        },
        {
          key: 'time_duration',
          sortable: true,
          formatter: v => v ? `${v.toFixed(2)} ms` : '',
          class: 'text-right',
        },
        {
          key: 'actions',
          label: '',
          class: 'text-right',
        },
      ].map(c => ({
        ...c,
        // Generate column label translation key
        label: this.$t(`columns.${c.key}`),
      })),
    }
  },

  computed: {
    loading () {
      return !this.refresh.countdown
    },

    autoRefreshLabel () {
      return !this.loading ? this.$t('refreshingIn', { seconds: this.refresh.countdown }) : this.$t('general:label.loading')
    },

    hasNextPage () {
      return this.filter.next
    },
  },

  watch: {
    route: {
      immediate: true,
      handler (route) {
        if (route) {
          this.resetItems()
        }
      },
    },
  },

  beforeDestroy () {
    this.clearRefresh()
  },

  methods: {
    loadItems ({ append = false } = {}) {
      this.clearRefresh()

      const oldBeforeID = this.filter.before
      this.filter.before = append ? this.filter.before : ''
      this.filter.routeID = this.route
      this.pagination.limit = append ? 10 : this.totalItems

      this.$SystemAPI.apigwProfilerRoute(this.encodeListParams())
        .then(({ filter = {}, set = [] }) => {
          const { next } = filter
          this.filter = { ...this.filter, next }
          this.items = [
            ...(append ? this.items : []),
            ...set.map(i => ({ ...i, hitID: i.ID })),
          ]
          this.totalItems = append ? this.totalItems + set.length : this.totalItems

          return { filter, set }
        })
        .catch(this.toastErrorHandler(this.$t('notification:gateway.profiler.fetch.error')))
        .finally(() => {
          if (!append) {
            this.filter.before = oldBeforeID
          }
          this.startRefresh()
        })
    },

    purgeRequests () {
      this.processingPurge = false

      const { routeID } = this.filter
      this.$SystemAPI.apigwProfilerPurge({ routeID })
        .then(() => {
          this.loadItems()
          this.toastSuccess(this.$t('notification:gateway.profiler.purge.success'))
        })
        .catch(this.toastErrorHandler(this.$t('notification:gateway.profiler.purge.error')))
        .finally(() => {
          this.processingPurge = true
        })
    },

    resetItems (sorting = this.sorting) {
      this.sorting = sorting
      this.filter.before = ''
      this.totalItems = 10
      this.loadItems()
    },

    loadMore () {
      this.filter.before = this.filter.next
      this.loadItems({ append: true })
    },

    // To start the refresh countdown
    startRefresh () {
      this.refresh.countdown = 10
      this.resetRefresh()
    },

    // If you need to temporarily stop the refresh countdown
    clearRefresh () {
      this.refresh.timer = clearTimeout(this.refresh.timer)
      this.refresh.countdown = 0
    },

    resetRefresh () {
      clearTimeout(this.refresh.timer)
      this.refresh.timer = setTimeout(() => {
        this.refresh.countdown--
        if (this.refresh.countdown) {
          this.resetRefresh()
        } else {
          this.loadItems()
        }
      }, 1000)
    },

    getStatusCodeVariant (statusCode = '') {
      const codeVariants = {
        2: 'success',
        3: 'info',
        4: 'danger',
        5: 'warning',
      }

      return codeVariants[statusCode[0]]
    },
  },
}
</script>

<style>

</style>
