<template>
  <b-container
    fluid="xl"
    class="d-flex flex-column h-100 pt-2 pb-3"
  >
    <c-content-header
      :title="$t('title')"
    />

    <b-card
      class="shadow-sm"
      body-class="p-0"
      footer-class="border-top d-flex flex-wrap flex-fill-child gap-1"
    >
      <template #header>
        <b-form
          class="d-flex flex-column w-100"
          @submit.prevent="search"
        >
          <b-row>
            <b-col
              cols="12"
              lg="6"
            >
              <b-form-group
                :label="$t('filter.from')"
                label-class="text-primary"
              >
                <c-input-date-time
                  v-model="filter.from"
                  data-test-id="filter-starting-from"
                  :labels="{
                    clear: $t('general:label.clear'),
                    none: $t('general:label.none'),
                    now: $t('general:label.now'),
                    today: $t('general:label.today'),
                  }"
                />
              </b-form-group>
            </b-col>
            <b-col
              cols="12"
              lg="6"
            >
              <b-form-group
                :label="$t('filter.to')"
                label-class="text-primary"
              >
                <c-input-date-time
                  v-model="filter.to"
                  data-test-id="filter-ending-at"
                  only-past
                  :labels="{
                    clear: $t('general:label.clear'),
                    none: $t('general:label.none'),
                    now: $t('general:label.now'),
                    today: $t('general:label.today'),
                  }"
                />
              </b-form-group>
            </b-col>
          </b-row>

          <b-row>
            <b-col
              cols="12"
              lg="4"
            >
              <b-form-group
                :label="$t('filter.resource')"
                label-class="text-primary"
              >
                <b-form-input
                  v-model="filter.resource"
                  data-test-id="input-resource"
                  size="sm"
                />
              </b-form-group>
            </b-col>
            <b-col
              cols="12"
              lg="4"
            >
              <b-form-group
                :label="$t('filter.action')"
                label-class="text-primary"
              >
                <b-form-input
                  v-model="filter.action"
                  data-test-id="input-action"
                  size="sm"
                />
              </b-form-group>
            </b-col>
            <b-col
              cols="12"
              lg="4"
            >
              <b-form-group
                :label="$t('filter.actor')"
                label-class="text-primary"
              >
                <b-form-input
                  v-model="filter.actorID"
                  data-test-id="input-user-id"
                  size="sm"
                />
              </b-form-group>
            </b-col>
          </b-row>

          <div class="d-flex flex-wrap flex-fill-child gap-1">
            <b-button
              data-test-id="button-submit"
              type="submit"
              :disabled="processing"
              variant="primary"
              class="ml-auto"
            >
              {{ $t('filter.search') }}
            </b-button>
          </div>
        </b-form>
      </template>

      <b-table
        id="resource-list"
        responsive
        hover
        class="mb-0 small"
        head-variant="light"
        :busy="processing"
        :items="items"
        :fields="fields"
        tbody-tr-class="pointer"
        :empty-text="$t('admin:general.notFound')"
        show-empty
        @row-clicked="item=>$set(item, '_showDetails', !item._showDetails)"
      >
        <template #table-busy>
          <div class="text-center m-5">
            <div>
              <b-spinner
                class="align-middle m-2"
              />
            </div>
            {{ $t('loading') }}
          </div>
        </template>
        <template #cell(timestamp)="{ item: a }">
          {{ a.timestamp | locFullDateTime }}
        </template>
        <template #cell(actor)="{ item: a }">
          <router-link
            v-if="a.actorID && a.actorID !== '0'"
            data-test-id="item-user-id"
            :to="drillDownLink({ actorID: a.actorID })"
          >
            {{ a.actor || a.actorID }}
          </router-link>
        </template>
        <template #cell(resource)="{ item: a }">
          <router-link
            data-test-id="item-resource"
            :to="drillDownLink({ resource: a.resource })"
          >
            {{ a.resource }}
          </router-link>
        </template>
        <template #cell(action)="{ item: a }">
          <router-link
            data-test-id="item-action"
            :to="drillDownLink({ action: a.action })"
          >
            {{ a.action }}
          </router-link>
        </template>
        <template #row-details="{ item: a }">
          <b-card-group>
            <b-card>
              <h6>{{ $t('details.header') }}</h6>
              <b-row>
                <b-col cols="4">
                  {{ $t('details.id') }}
                </b-col>
                <b-col>
                  {{ a.actionID }}
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="4">
                  {{ $t('details.timestamp') }}
                </b-col>
                <b-col
                  data-test-id="details-timestamp"
                >
                  {{ a.timestamp | locFullDateTime }}
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="4">
                  {{ $t('details.requestOrigin') }}
                </b-col>
                <b-col
                  data-test-id="details-request-origin"
                >
                  {{ a.requestOrigin }}
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="4">
                  {{ $t('details.requestID') }}
                </b-col>
                <b-col>
                  {{ a.requestID }}
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="4">
                  {{ $t('details.actorIPAddr') }}
                </b-col>
                <b-col>
                  {{ a.actorIPAddr }}
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="4">
                  {{ $t('details.actor') }}
                </b-col>
                <b-col
                  data-test-id="details-user"
                >
                  {{ a.actor }}
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="4">
                  {{ $t('details.actorID') }}
                </b-col>
                <b-col
                  data-test-id="details-user-id"
                >
                  {{ a.actorID }}
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="4">
                  {{ $t('details.severity') }}
                </b-col>
                <b-col
                  data-test-id="details-severity"
                >
                  {{ getSeverityLabel(a.severity) }}
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="4">
                  {{ $t('details.resource') }}
                </b-col>
                <b-col
                  data-test-id="details-resource"
                >
                  {{ a.resource }}
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="4">
                  {{ $t('details.action') }}
                </b-col>
                <b-col
                  data-test-id="details-action"
                >
                  {{ a.action }}
                </b-col>
              </b-row>
            </b-card>

            <b-card>
              <h6>{{ $t('details.headerAdditional') }}</h6>
              <b-row>
                <b-col cols="4">
                  {{ $t('details.description') }}
                </b-col>
                <b-col>
                  {{ a.description }}
                </b-col>
              </b-row>
              <b-row v-if="a.error">
                <b-col cols="4">
                  {{ $t('details.error') }}
                </b-col>
                <b-col>
                  {{ a.error }}
                </b-col>
              </b-row>

              <template v-if="a.meta">
                <hr>
                <h6>{{ $t('details.meta') }}</h6>
                <b-row
                  v-for="(val, key) in a.meta"
                  :key="key"
                >
                  <b-col>
                    <code>{{ key }}</code>
                  </b-col>
                  <b-col>
                    <code>{{ val }}</code>
                  </b-col>
                </b-row>
              </template>
            </b-card>
          </b-card-group>
        </template>
      </b-table>

      <template #footer>
        <b-button
          v-if="items.length"
          data-test-id="button-load-older-actions"
          variant="light"
          class="mx-auto"
          @click.stop="load()"
        >
          {{ $t('loadOlder') }}
        </b-button>
      </template>
    </b-card>
  </b-container>
</template>

<script>
import listHelpers from 'corteza-webapp-admin/src/mixins/listHelpers'
import { components } from '@cortezaproject/corteza-vue'
const { CInputDateTime } = components

export default {
  components: {
    CInputDateTime,
  },

  mixins: [
    listHelpers,
  ],

  i18nOptions: {
    namespaces: 'system.actionlog',
    keyPrefix: 'list',
  },

  data () {
    return {
      id: 'actionlog',

      processing: true,

      filter: {
        from: undefined,
        to: undefined,
        beforeActionID: undefined,
        actorID: undefined,
        resource: undefined,
        action: undefined,
      },

      pagination: {
        limit: 10,
      },

      fields: [
        {
          key: 'timestamp',
          tdClass: 'text-nowrap',
          // formatter: (v) => moment(v).fromNow(),
        },
        {
          key: 'actor',
        },
        {
          key: 'requestOrigin',
        },
        {
          key: 'resource',
        },
        {
          key: 'action',
        },
        {
          key: 'description',
        },
        {
          key: 'severity',
          label: '',
          tdClass: (v, k, item) => ['text-right', this.severity[item.severity].class],
          formatter: (v) => this.severity[v].label,
        },
      ].map(c => ({
        // Generate column label translation key
        label: this.$t(`columns.${c.key}`),
        ...c,
      })),

      items: [],

      severity: [
        {
          label: this.$t('severity.emergency'),
          class: 'text-danger',
        },
        {
          label: this.$t('severity.alert'),
          class: 'text-danger',
        },
        {
          label: this.$t('severity.critical'),
          class: 'text-danger',
        },
        {
          label: this.$t('severity.error'),
          class: 'text-danger',
        },
        {
          label: this.$t('severity.warning'),
          class: 'text-warning',
        },
        {
          label: this.$t('severity.notice'),
          class: 'text-success',
        },
        {
          label: this.$t('severity.info'),
          class: 'text-success',
        },
        {
          label: this.$t('severity.debug'),
          class: '',
        },
      ],
    }
  },

  mounted () {
    this.load()
  },

  methods: {
    search () {
      // Do a complete search, not just beforeActionID
      this.load(true)
    },

    // Overwrites mixin method
    encodeRouteParams () {
      return {
        query: {
          ...this.pagination,
          ...this.filter,
        },
      }
    },

    load (reset = false) {
      if (reset) {
        this.items.length = 0
        this.pagination.beforeActionID = undefined
      } else {
        const len = this.items.length
        if (len > 0) {
          this.pagination.beforeActionID = (this.items[len - 1] || {}).actionID
        }
      }

      if (!this.filter.actorID) {
        this.$delete(this.filter, 'actorID')
      }

      if (!this.filter.action) {
        this.$delete(this.filter, 'action')
      }

      if (!this.filter.resource) {
        this.$delete(this.filter, 'resource')
      }

      this.processing = true

      this.procListResults(this.$SystemAPI.actionlogList({ ...this.filter, ...this.pagination }))
        .then(rr => {
          this.items.push(...rr)
        })
        .finally(() => {
          this.processing = false
        })
    },

    // Resets pagination & sorting and adds filtering params for drill-down
    drillDownLink (query = {}) {
      return {
        name: 'system.actionlog',
        query: {
          ...this.$route.query,
          ...query,
          sort: undefined,
        },
      }
    },

    getSeverityLabel (index = -1) {
      if (index >= 0) {
        return this.severity[index] ? this.severity[index].label.toLowerCase() : index
      }
    },
  },
}
</script>
