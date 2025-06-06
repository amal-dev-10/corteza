<template>
  <b-container
    data-tets-id="profiler"
    fluid="xl"
    class="d-flex flex-column flex-fill pt-2 pb-3"
  >
    <c-content-header
      :title="$t('title')"
    />

    <b-card
      no-body
      data-test-id="card-profiler"
      header-class="border-bottom"
      body-class="p-0"
      footer-class="border-top d-flex align-items-center justify-content-center"
      class="flex-fill shadow-sm"
    >
      <template #header>
        <h4>
          {{ $t('general:label.routes') }}
        </h4>
        <em>{{ description }}</em>
      </template>

      <div class="d-flex align-items-center flex-wrap p-3 gap-1">
        <div class="flex-fill">
          <b-button
            data-test-id="button-refresh"
            variant="primary"
            :disabled="loading"
            size="lg"
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
          :processing="processingPurgeRequests"
          :text="$t('purge.all')"
          variant="danger"
          size="lg"
          button-class="flex-fill"
          class="d-flex justify-content-end ml-auto"
          @confirmed="purgeRequests"
        />
      </div>

      <b-table
        id="route-list"
        hover
        responsive
        head-variant="light"
        class="mb-0"
        primary-key="routeID"
        :sort-by.sync="sorting.sortBy"
        :sort-desc.sync="sorting.sortDesc"
        :items="items"
        :fields="fields"
        :busy="loading"
        no-local-sorting
        @sort-changed="resetItems"
      >
        <template #cell(actions)="row">
          <b-button
            variant="link"
            class="p-0"
            :to="{ name: 'system.apigw.profiler.route.list', params: { routeID: row.item.routeID } }"
          >
            <font-awesome-icon
              :icon="['fas', 'info-circle']"
              class="text-primary"
            />
          </b-button>
        </template>
      </b-table>

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
  </b-container>
</template>

<script>
import listHelpers from 'corteza-webapp-admin/src/mixins/listHelpers'

export default {
  mixins: [
    listHelpers,
  ],

  i18nOptions: {
    namespaces: ['system.apigw'],
    keyPrefix: 'profiler',
  },

  data () {
    return {
      id: 'routes',

      processingPurgeRequests: false,

      filter: {
        next: '',
        before: '',
        query: '',
        deleted: 0,
      },

      sorting: {
        sortBy: 'path',
        sortDesc: false,
      },

      totalItems: 0,

      items: [],

      refresh: {
        timer: undefined,
        countdown: 0,
      },

      fields: [
        {
          key: 'path',
          sortable: true,
        },
        {
          key: 'count',
          sortable: true,
          class: 'text-right',
        },
        {
          key: 'size_min',
          sortable: true,
          class: 'text-right',
        },
        {
          key: 'size_max',
          sortable: true,
          class: 'text-right',
          formatter: v => `${(v / 1000).toFixed(3)} kB`,
        },
        {
          key: 'size_avg',
          sortable: true,
          class: 'text-right',
          formatter: v => `${(v / 1000).toFixed(3)} kB`,
        },
        {
          key: 'time_min',
          sortable: true,
          class: 'text-right',
          formatter: v => `${v.toFixed(2)} ms`,
        },
        {
          key: 'time_max',
          sortable: true,
          class: 'text-right',
          formatter: v => `${v.toFixed(2)} ms`,
        },
        {
          key: 'time_avg',
          sortable: true,
          class: 'text-right',
          formatter: v => `${v.toFixed(2)} ms`,
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

    description () {
      return this.$Settings.get('apigw.profiler.global', false) ? this.$t('description.globalEnabled') : this.$t('description.globalDisabled')
    },

    hasNextPage () {
      return this.filter.next
    },
  },

  watch: {
    route: {
      immediate: true,
      handler () {
        this.resetItems()
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
      this.filter.routeID = this.$route.params.routeID
      this.pagination.limit = append ? 10 : this.totalItems

      this.$SystemAPI.apigwProfilerAggregation(this.encodeListParams())
        .then(({ filter = {}, set = [] }) => {
          const { next } = filter
          this.filter = { ...this.filter, next }
          this.items = [
            ...(append ? this.items : []),
            ...set.map(i => ({ ...i, routeID: this.encodeRouteID(i.path) })),
          ]
          this.totalItems = append ? this.totalItems + set.length : this.totalItems

          return { filter, set }
        }).finally(() => {
          if (!append) {
            this.filter.before = oldBeforeID
          }
          this.startRefresh()
        })
    },

    purgeRequests () {
      this.processingPurgeRequests = true
      this.$SystemAPI.apigwProfilerPurgeAll()
        .then(() => {
          this.loadItems()
          this.toastSuccess(this.$t('notification:gateway.profiler.purge.success'))
        })
        .catch(this.toastErrorHandler(this.$t('notification:gateway.profiler.purge.error')))
        .finally(() => {
          this.processingPurgeRequests = false
        })
    },

    resetItems (sorting = this.sorting) {
      this.sorting = sorting
      this.filter.before = ''
      this.totalItems = 10
      this.loadItems()
    },

    encodeRouteID (routeID) {
      return btoa(routeID)
    },

    loadMore () {
      this.filter.before = this.filter.next
      this.loadItems({ append: true })
    },

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
  },
}
</script>
