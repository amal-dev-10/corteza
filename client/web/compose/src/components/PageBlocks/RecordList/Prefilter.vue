<template>
  <c-form-table-wrapper hide-add-button>
    <b-form-group
      :label="$t('recordList.record.prefilterCommand')"
      label-class="text-primary"
      class="m-0"
    >
      <template v-if="textInput">
        <c-input-expression
          v-model="options.prefilter"
          height="3.688rem"
          :suggestion-params="recordAutoCompleteParams"
        />

        <i18next
          path="recordList.record.prefilterFootnote"
          tag="small"
          class="text-muted"
        >
          <code>${record.values.fieldName}</code>
          <code>${recordID}</code>
          <code>${ownerID}</code>
          <span><code>${userID}</code>, <code>${user.name}</code></span>
        </i18next>

        <div class="d-flex align-items-center justify-content-end mt-1">
          <b-button
            variant="link"
            size="sm"
            class="text-decoration-none"
            @click="toggleFilterInputType"
          >
            {{ $t('recordList.prefilter.toggleInputType') }}
          </b-button>
        </div>
      </template>

      <template v-else>
        <filter-toolbox
          v-model="filterGroup"
          :module="module"
          :mock.sync="mock"
          reset-filter-on-created
          start-empty
        />

        <div class="d-flex align-items-center justify-content-end mt-1 gap-1">
          <b-button
            variant="light"
            size="sm"
            @click="toggleFilterInputType"
          >
            {{ $t('general:label.cancel') }}
          </b-button>

          <b-button
            variant="primary"
            size="sm"
            class="ml-1"
            @click="saveFilter"
          >
            {{ $t('general:label.save') }}
          </b-button>
        </div>
      </template>
    </b-form-group>
  </c-form-table-wrapper>
</template>

<script>
import { components } from '@cortezaproject/corteza-vue'
import { compose, validator } from '@cortezaproject/corteza-js'
import {
  getRecordListFilterSql,
  trimChar,
} from 'corteza-webapp-compose/src/lib/record-filter.js'
import FilterToolbox from 'corteza-webapp-compose/src/components/Common/FilterToolbox.vue'
import autocomplete from 'corteza-webapp-compose/src/mixins/autocomplete.js'

const { CInputExpression } = components

export default {
  i18nOptions: {
    namespaces: 'block',
  },

  name: 'RecordListConfiguratorPrefilter',

  components: {
    FilterToolbox,
    CInputExpression,
  },

  mixins: [autocomplete],

  props: {
    options: {
      type: Object,
      required: true,
    },

    namespace: {
      type: compose.Namespace,
      required: true,
    },

    module: {
      type: compose.Module,
      required: true,
    },

    record: {
      type: [Object, null],
      required: false,
      default: null,
    },
  },

  data () {
    return {
      textInput: true,
      filterGroup: [],
    }
  },

  computed: {
    recordAutoCompleteParams () {
      return this.processRecordAutoCompleteParams({ operators: true })
    },
  },

  created () {
    // Change all module fields to single value to keep multi value fields and single value
    const module = JSON.parse(JSON.stringify(this.module || {}))

    module.fields = [
      ...[...module.fields].map((f) => {
        f.multi = f.isMulti
        f.isMulti = false

        // Disable edge case options
        if (f.kind === 'DateTime') {
          f.options.onlyFutureValues = false
          f.options.onlyPastValues = false
        }

        return f
      }),
      ...this.module.systemFields().map((sf) => {
        return { ...sf, label: this.$t(`field:system.${sf.name}`) }
      }),
    ]

    this.mock = {
      namespace: this.namespace,
      module,
      errors: new validator.Validated(),
    }
  },

  methods: {
    saveFilter (filter) {
      if (filter && filter[0] && !filter[0].filter[0].name) {
        return
      }

      this.options.prefilter = this.parseFilter()
      this.toggleFilterInputType()
    },

    toggleFilterInputType () {
      this.textInput = !this.textInput
    },

    getOptionKey ({ name }) {
      return name
    },

    processFilter (filterGroup = this.value) {
      return filterGroup.map(({ groupCondition, filter = [], name }) => {
        filter = filter.map(({ record, ...f }) => {
          if (!f.name || !record) {
            return undefined
          }

          if (this.isBetweenOperator(f.operator)) {
            f.value = {
              start: this.getField(f.name).isSystem
                ? record[`${f.name}-start`]
                : record.values[`${f.name}-start`],
              end: this.getField(f.name).isSystem
                ? record[`${f.name}-end`]
                : record.values[`${f.name}-end`],
            }
          } else {
            f.value = record.values[f.name] || record[f.name]
          }

          return f
        })

        return { groupCondition, filter, name }
      })
    },

    isBetweenOperator (op) {
      return ['BETWEEN', 'NOT BETWEEN'].includes(op)
    },

    parseFilter (filterGroup = this.filterGroup) {
      const filter = this.processFilter(filterGroup)

      const filterSqlArray = filter
        .map(({ groupCondition, filter = [] }) => {
          groupCondition = groupCondition ? ` ${groupCondition} ` : ''
          filter = getRecordListFilterSql(filter)

          return filter ? `${filter}${groupCondition}` : ''
        })
        .filter((filter) => filter)

      const filterSql = trimChar(
        trimChar(filterSqlArray.join(''), ' AND '),
        ' OR ',
      )

      return filterSql
    },
  },
}
</script>
